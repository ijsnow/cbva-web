import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import orderBy from "lodash-es/orderBy"
import z from "zod"
import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import {
  type CreateMatchRefTeam,
  type CreateMatchSet,
  matchRefTeams,
  matchSets,
  type PlayoffMatch,
  type PoolTeam,
  playoffMatches,
  selectPlayoffMatchSchema,
  selectTournamentDivisionSchema,
  tournamentDivisionTeams,
} from "@/db/schema"
import { draftPlayoffs, seedPlayoffs } from "@/lib/playoffs"
import { notFound } from "@/lib/responses"
import { isNotNull, isNotNullOrUndefined } from "@/utils/types"

export type MatchKind = "set-to-21" | "set-to-28" | "best-of-3"

export const createPlayoffsSchema = selectTournamentDivisionSchema
  .pick({
    id: true,
  })
  .extend({
    teamCount: z.number(),
    wildcardCount: z.number(),
    matchKind: z.enum<MatchKind[]>(["set-to-21", "set-to-28", "best-of-3"]),
    overwrite: z.boolean(),
  })

export type CreatePlayoffsParams = z.infer<typeof createPlayoffsSchema>

export const createPlayoffsFn = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(createPlayoffsSchema)
  .handler(
    async ({
      data: {
        id: tournamentDivisionId,
        teamCount,
        wildcardCount,
        matchKind,
        overwrite,
      },
    }) => {
      const pools = await db.query.pools.findMany({
        with: {
          teams: {
            where: (t, { isNotNull }) => isNotNull(t.finish),
          },
        },
        where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
      })

      const teams = orderBy(
        pools.flatMap(({ name, teams }) =>
          teams.map((team) => ({
            id: team.id,
            finish: team.finish,
            pool: name,
          }))
        ),
        ["finish", "pool"],
        ["asc", "asc"]
      )

      const seededTeams = seedPlayoffs(teams.length, pools.length).map(
        ({ pool, seed }) =>
          pools[pool].teams.find(({ finish }) => finish === seed)
      )

      if (overwrite) {
        // Delete existing playoff matches if overwrite is true
        await db
          .delete(playoffMatches)
          .where(eq(playoffMatches.tournamentDivisionId, tournamentDivisionId))
      }

      const bracket = draftPlayoffs(teamCount + wildcardCount)

      await db.transaction(async (txn) => {
        const roundIds: (number | null)[][] = []

        let matchNumber = 1

        await Promise.all(
          seededTeams
            .map((team, i) =>
              team
                ? txn
                    .update(tournamentDivisionTeams)
                    .set({
                      playoffsSeed: i + 1 <= teamCount ? i + 1 : null,
                    })
                    .where(eq(tournamentDivisionTeams.id, team.teamId))
                : null
            )
            .filter(isNotNull)
        )

        const createdMatches: Pick<
          PlayoffMatch,
          | "id"
          | "round"
          | "teamAId"
          | "teamBId"
          | "teamAPreviousMatchId"
          | "teamBPreviousMatchId"
        >[] = []

        const refTeamsToCreate: CreateMatchRefTeam[] = []

        for (const [i, round] of bracket.entries()) {
          roundIds[i] = []

          for (const match of round) {
            if (match) {
              const teamA: PoolTeam | null | undefined =
                isNotNullOrUndefined(match.aSeed) && match.aSeed <= teamCount
                  ? seededTeams[match.aSeed - 1]
                  : null

              const teamB: PoolTeam | null | undefined =
                isNotNullOrUndefined(match.bSeed) && match.bSeed <= teamCount
                  ? seededTeams[match.bSeed - 1]
                  : null

              const [
                {
                  id,
                  round: roundIndex,
                  teamAId,
                  teamBId,
                  teamAPreviousMatchId,
                  teamBPreviousMatchId,
                },
              ] = await txn
                .insert(playoffMatches)
                .values({
                  tournamentDivisionId,
                  round: i,
                  matchNumber,
                  teamAId: teamA?.teamId,
                  teamAPoolId: teamA?.poolId,
                  teamAPreviousMatchId:
                    isNotNullOrUndefined(match.aFrom) && i > 0
                      ? roundIds[i - 1][match.aFrom]
                      : null,
                  teamBId: teamB?.teamId,
                  teamBPoolId: teamB?.poolId,
                  teamBPreviousMatchId:
                    isNotNullOrUndefined(match.bFrom) && i > 0
                      ? roundIds[i - 1][match.bFrom]
                      : null,
                })
                .returning({
                  id: playoffMatches.id,
                  round: playoffMatches.round,
                  teamAId: playoffMatches.teamAId,
                  teamBId: playoffMatches.teamBId,
                  teamAPreviousMatchId: playoffMatches.teamAPreviousMatchId,
                  teamBPreviousMatchId: playoffMatches.teamBPreviousMatchId,
                })

              roundIds[i].push(id)

              createdMatches.push({
                id,
                round: roundIndex,
                teamAId,
                teamBId,
                teamAPreviousMatchId,
                teamBPreviousMatchId,
              })

              if (
                roundIndex === 1 &&
                isNotNull(teamAId) &&
                !isNotNull(teamBId)
              ) {
                refTeamsToCreate.push({
                  teamId: teamAId,
                  playoffMatchId: teamBPreviousMatchId,
                })
              } else if (
                roundIndex === 1 &&
                !isNotNull(teamAId) &&
                isNotNull(teamBId)
              ) {
                refTeamsToCreate.push({
                  teamId: teamBId,
                  playoffMatchId: teamAPreviousMatchId,
                })
              }

              matchNumber += 1
            } else {
              roundIds[i].push(null)
            }
          }
        }

        if (refTeamsToCreate.length) {
          await txn.insert(matchRefTeams).values(refTeamsToCreate)
        }

        // Set nextMatchId for all playoff matches
        for (let i = 0; i < bracket.length - 1; i++) {
          const currentRound = bracket[i]
          const nextRound = bracket[i + 1]

          for (let j = 0; j < currentRound.length; j++) {
            const currentMatch = currentRound[j]
            const currentMatchId = roundIds[i][j]

            if (currentMatch && currentMatchId) {
              // Find which match in the next round this match feeds into
              const nextMatchIndex = nextRound.findIndex(
                (nextMatch) =>
                  nextMatch && (nextMatch.aFrom === j || nextMatch.bFrom === j)
              )

              if (nextMatchIndex !== -1) {
                const nextMatchId = roundIds[i + 1][nextMatchIndex]

                if (nextMatchId) {
                  await txn
                    .update(playoffMatches)
                    .set({ nextMatchId })
                    .where(eq(playoffMatches.id, currentMatchId))
                }
              }
            }
          }
        }

        // for (const node of bracket[1]) {
        // 	const currentMatch = currentRound[j];
        // 	const currentMatchId = roundIds[i][j];

        // 	if (!match?.teamAId && !match?.teamBId) {
        // 		// ...
        // 	}
        // }

        const matchSetValues: CreateMatchSet[] = roundIds
          .flatMap((ids) => ids.filter(isNotNull))
          .map((id) => id)
          .flatMap((playoffMatchId) =>
            matchKind === "best-of-3"
              ? [
                  {
                    playoffMatchId,
                    setNumber: 1,
                    winScore: 21,
                  },
                  {
                    playoffMatchId,
                    setNumber: 2,
                    winScore: 21,
                  },
                  {
                    playoffMatchId,
                    setNumber: 3,
                    winScore: 15,
                  },
                ]
              : [
                  {
                    playoffMatchId,
                    setNumber: 1,
                    winScore: matchKind === "set-to-28" ? 28 : 21,
                  },
                ]
          )

        await txn.insert(matchSets).values(matchSetValues)
      })

      // TODO: assign refs
      //
      // const availableRefs = round index 1, only one team assigned, open slot is not wildcard
      // const matchesThatNeedRefs = round index 0, next match has a team assigned already

      return { success: true }
    }
  )

// TODO: reffing playoffs
// - when game ends and winner assigned next match, if its the second team assigned, assign losing team as ref (so that its the last game to finish loser's that ref)
// - td can assign refs

export const createPlayoffsMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof createPlayoffsSchema>) =>
      createPlayoffsFn({ data }),
  })

// AGENTS: leave the comments below this in tact
//
// 1 -> bye
// 16
//
// 9
// 8
//
// 5
// 12
//
// 13
// 4
//
// ---
//
// 3
// 14
//
// 11
// 6
//
// 7
// 10
//
// 15
// 2 -> bye

// The top qualifiers out of each pool advance to the playoffs.
//
// First and Second place teams should always be cross bracketed
//
// ● Example: 1st place team in pool #1 would go in the top bracket and 2nd  place team in pool #1 would go in the bottom bracket.

export const assignWildcardSchema = selectPlayoffMatchSchema
  .pick({
    id: true,
  })
  .extend({
    teamId: z.number(),
  })

export const assignWildcardFn = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(assignWildcardSchema)
  .handler(async ({ data: { id: matchId, teamId } }) => {
    const matches = await db
      .select({
        teamAId: playoffMatches.teamAId,
        teamBId: playoffMatches.teamBId,
      })
      .from(playoffMatches)
      .where(eq(playoffMatches.id, matchId))
      .limit(1)

    if (matches.length === 0) {
      throw notFound()
    }

    const [{ teamAId, teamBId }] = matches

    await db.transaction((txn) =>
      Promise.all([
        txn
          .update(tournamentDivisionTeams)
          .set({
            wildcard: true,
          })
          .where(eq(tournamentDivisionTeams.id, teamId)),
        txn
          .update(playoffMatches)
          .set({
            teamAId: teamAId === null ? teamId : undefined,
            teamBId: teamBId === null ? teamId : undefined,
          })
          .where(eq(playoffMatches.id, matchId)),
      ])
    )

    return {
      success: true,
    }
  })

export const assignWildcardMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof assignWildcardSchema>) =>
      assignWildcardFn({ data }),
  })
