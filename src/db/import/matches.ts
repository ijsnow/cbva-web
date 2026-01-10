import { eq, inArray, type SQL, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/gel-core"
import { chunk } from "lodash-es"
import { db } from "../connection"
import { legacy } from "../legacy"
import * as legacyTables from "../legacy/schema/tables"
import { bytesToScore } from "../legacy/utils"
import {
  matchSets,
  playoffMatches,
  poolMatches,
  type UpdatePlayoffMatch,
} from "../schema"

export async function importGames(year: number) {
  const legacyTournamentsForYear = await legacy.query.tournaments.findMany({
    where: (t, { and, gte, lt, ne }) =>
      and(
        gte(t.startAt, new Date(`${year}-01-01`)),
        lt(t.startAt, new Date(`${year + 1}-01-01`)),
        ne(t.status, "Schedule"),
        ne(t.status, "Cancelled")
      ),
  })

  const tournamentsMap = (
    await db._query.tournaments.findMany({
      with: {
        tournamentDivisions: true,
      },
      where: (t, { and, gte, lt }) =>
        and(gte(t.date, `${year}-01-01`), lt(t.date, `${year + 1}-01-01`)),
    })
  ).reduce<{ [key: string]: number }>((memo, { tournamentDivisions }) => {
    for (const td of tournamentDivisions) {
      memo[td.externalRef] = td.id
    }
    return memo
  }, {})

  const legacyPoolsForYear = await legacy.query.pools.findMany({
    where: (pools, { inArray }) =>
      inArray(
        pools.tournamentId,
        legacyTournamentsForYear.map((t) => t.id)
      ),
  })

  const poolsForYear = await db._query.pools.findMany({
    with: {
      teams: {
        with: {
          team: true,
        },
      },
    },
    where: (t, { inArray }) =>
      inArray(
        t.externalRef,
        legacyPoolsForYear.map((p) => p.id)
      ),
  })

  const poolsMap = poolsForYear.reduce<{ [key: string]: number }>(
    (memo, pool) => {
      memo[pool.externalRef] = pool.id

      return memo
    },
    {}
  )

  const teamsMap = poolsForYear
    .flatMap(({ teams }) => teams)
    .reduce<{ [key: string]: number }>((memo, poolTeam) => {
      memo[poolTeam.team.externalRef] = poolTeam.teamId

      return memo
    }, {})

  const poolMatchData = await legacy.query.poolMatches.findMany({
    with: {
      pool: true,
      teamA: true,
      teamB: true,
      matchSets: true,
    },
    where: (t, { inArray }) =>
      inArray(
        t.poolId,
        legacyPoolsForYear.map((p) => p.id)
      ),
  })

  const poolMatchesToCreate: (typeof poolMatches.$inferInsert)[] =
    poolMatchData.map((pm) => {
      const tow = pm.matchSets.reduce<number | null>((memo, ms) => {
        const score = ms.score ? bytesToScore(convertHex(ms.score)) : null

        if (score === null) {
          return null
        }

        if (score[0] > score[1]) {
          return (memo || 0) + 1
        }
        return (memo || 0) - 1
      }, null)

      const winnerId = tow === null ? null : tow > 0 ? pm.teamAId : pm.teamBId

      return {
        poolId: poolsMap[pm.poolId] as number,
        teamAId: pm.teamAId ? (teamsMap[pm.teamAId] as number) : null,
        teamBId: pm.teamBId ? (teamsMap[pm.teamBId] as number) : null,
        winnerId: winnerId ? (teamsMap[winnerId] as number) : null,
        matchNumber: pm.matchNumber,
        court: pm.court,
        externalRef: pm.id,
      }
    })

  const poolMatchesMap = new Map<string, number>()

  for (const batch of chunk(poolMatchesToCreate, 500)) {
    console.log(
      `pool_matches(${year}): inserting batch of size ${batch.length}`
    )

    const result = await db.insert(poolMatches).values(batch).returning({
      id: poolMatches.id,
      externalRef: poolMatches.externalRef,
    })

    for (const row of result) {
      poolMatchesMap.set(row.externalRef as string, row.id)
    }
  }

  const poolMatchSetsToCreate: (typeof matchSets.$inferInsert)[] =
    poolMatchData.flatMap(({ id, teamAId, teamBId, matchSets }) =>
      matchSets.map((ms) => {
        const score = ms.score ? bytesToScore(convertHex(ms.score)) : null

        return {
          poolMatchId: poolMatchesMap.get(id) as number,
          setNumber: ms.setNumber,
          teamAScore: score ? score[0] : undefined,
          teamBScore: score ? score[1] : undefined,
          winScore: ms.winScore,
          winnerId: score
            ? score[0] > score[1]
              ? (teamsMap[teamAId as string] as number)
              : (teamsMap[teamBId as string] as number)
            : null,
          status: "completed",
          startedAt: ms.startedAt ? new Date(ms.startedAt.toString()) : null,
          endedAt: ms.endedAt ? new Date(ms.endedAt.toString()) : null,
          externalRef: ms.id,
        }
      })
    )

  for (const batch of chunk(poolMatchSetsToCreate, 500)) {
    console.log(
      `pool_matches->match_sets(${year}): inserting batch of size ${batch.length}`
    )

    await db
      .insert(matchSets)
      .values(batch)
      .returning({ id: matchSets.id, externalRef: matchSets.externalRef })
  }

  const playoffMatchData = await legacy.query.playoffMatches.findMany({
    with: {
      teamA: true,
      teamB: true,
      matchSets: true,
    },
    where: (t, { inArray }) =>
      inArray(
        t.tournamentId,
        legacyTournamentsForYear.map((p) => p.id)
      ),
  })

  const playoffMatchesToCreate: (typeof playoffMatches.$inferInsert)[] =
    playoffMatchData.map((pm) => {
      const tow = pm.matchSets.reduce<number | null>((memo, ms) => {
        const score = ms.score ? bytesToScore(convertHex(ms.score)) : null

        if (score === null) {
          return null
        }

        if (score[0] > score[1]) {
          return (memo || 0) + 1
        }
        return (memo || 0) - 1
      }, null)

      const winnerId = tow === null ? null : tow > 0 ? pm.teamAId : pm.teamBId

      return {
        tournamentDivisionId: tournamentsMap[pm.tournamentId] as number,
        teamAId: pm.teamAId ? (teamsMap[pm.teamAId] as number) : null,
        teamBId: pm.teamBId ? (teamsMap[pm.teamBId] as number) : null,
        winnerId: winnerId ? (teamsMap[winnerId] as number) : null,
        matchNumber: pm.matchNumber,
        court: pm.court,
        externalRef: pm.id,
      }
    })

  const playoffMatchesMap = new Map<string, number>()

  for (const batch of chunk(playoffMatchesToCreate, 500)) {
    console.log(
      `pool_matches(${year}): inserting batch of size ${batch.length}`
    )

    const result = await db.insert(playoffMatches).values(batch).returning({
      id: playoffMatches.id,
      externalRef: playoffMatches.externalRef,
    })

    for (const row of result) {
      playoffMatchesMap.set(row.externalRef as string, row.id)
    }
  }

  const playoffMatchSetsToCreate: (typeof matchSets.$inferInsert)[] =
    playoffMatchData.flatMap(({ id, teamAId, teamBId, matchSets }) =>
      matchSets.map((ms) => {
        const score = ms.score ? bytesToScore(convertHex(ms.score)) : null

        return {
          playoffMatchId: playoffMatchesMap.get(id) as number,
          setNumber: ms.setNumber,
          teamAScore: score ? score[0] : undefined,
          teamBScore: score ? score[1] : undefined,
          winScore: ms.winScore,
          winnerId: score
            ? score[0] > score[1]
              ? (teamsMap[teamAId as string] as number)
              : (teamsMap[teamBId as string] as number)
            : null,
          status: "completed",
          startedAt: ms.startedAt ? new Date(ms.startedAt.toString()) : null,
          endedAt: ms.endedAt ? new Date(ms.endedAt.toString()) : null,
          externalRef: ms.id,
        }
      })
    )

  for (const batch of chunk(playoffMatchSetsToCreate, 500)) {
    console.log(
      `playoff_matches->match_sets(${year}): inserting batch of size ${batch.length}`
    )

    await db
      .insert(matchSets)
      .values(batch)
      .returning({ id: matchSets.id, externalRef: matchSets.externalRef })
  }

  await buildPlayoffTrees(playoffMatchesMap, new Map(Object.entries(poolsMap)))
}

function convertHex(bytes: string) {
  // Convert hex string to base64, then decode to bytes
  const cleanHex = bytes.replace(/\\x/g, "")

  return Buffer.from(cleanHex, "hex").toString("ascii")
}

async function buildPlayoffTrees(
  playoffMatchMap: Map<string, number>,
  poolsMap: Map<string, number>
) {
  console.log("fixing playoff trees")

  const legacyPlayoffMatches = await legacy.query.playoffMatches.findMany({
    where: (t, { inArray }) =>
      inArray(t.id, Array.from(playoffMatchMap.keys())),
  })

  await db.transaction(async (txn) => {
    for (const pm of legacyPlayoffMatches) {
      await txn
        .update(playoffMatches)
        .set({
          teamAPoolId:
            pm.aFromId && poolsMap.has(pm.aFromId)
              ? poolsMap.get(pm.aFromId)
              : null,
          teamBPoolId:
            pm.bFromId && poolsMap.has(pm.bFromId)
              ? poolsMap.get(pm.bFromId)
              : null,
          teamAPreviousMatchId:
            pm.aFromId && playoffMatchMap.has(pm.aFromId)
              ? playoffMatchMap.get(pm.aFromId)
              : null,
          teamBPreviousMatchId:
            pm.bFromId && playoffMatchMap.has(pm.bFromId)
              ? playoffMatchMap.get(pm.bFromId)
              : null,
        })
        .where(eq(playoffMatches.externalRef, pm.id))
    }
  })

  console.log("done")
}
