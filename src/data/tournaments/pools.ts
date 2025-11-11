import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import range from "lodash/range";
import { eq, inArray, sql } from "drizzle-orm";
import z from "zod";

import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
  CreateMatchSet,
  CreatePoolMatch,
	CreatePoolTeam,
	matchSets,
	poolMatches,
	pools,
	poolTeams,
	selectTournamentDivisionSchema,
} from "@/db/schema";
import { snake } from "@/lib/snake-draft";
import { badRequest, notFound } from "@/lib/responses";
import { P } from "node_modules/better-auth/dist/shared/better-auth.BUpnjBGu";

export const createPoolsSchema = selectTournamentDivisionSchema
	.pick({
		id: true,
	})
	.extend({
		count: z.number(),
		overwrite: z.boolean(),
	});

const createPoolsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(createPoolsSchema)
	.handler(async ({ data: { id: tournamentDivisionId, count, overwrite } }) => {
		const alphabet = "abcdefghijklmnopqrstuvwxyz";

		if (count > alphabet.length) {
			setResponseStatus(400);

			throw new Error("Pool count exceeds limit");
		}

		const createPoolsQuery = db
			.insert(pools)
			.values(
				range(0, count).map((i) => ({
					tournamentDivisionId,
					name: alphabet[i],
				})),
			)
			.returning({
				id: pools.id,
				name: pools.name,
			});

		if (overwrite) {
			await db
				.delete(pools)
				.where(eq(pools.tournamentDivisionId, tournamentDivisionId));
		}

		// TODO: maybe delete and let db clean up team assignments, games, etc
		const createdPools = await (overwrite
			? createPoolsQuery.onConflictDoNothing()
			: createPoolsQuery);

		const teams = await db.query.tournamentDivisionTeams.findMany({
			columns: {
				id: true,
				seed: true,
			},
			where: (t, { eq, and }) =>
				and(
					eq(t.tournamentDivisionId, tournamentDivisionId),
					eq(t.status, "confirmed"),
				),
			orderBy: (t, { asc }) => asc(t.seed),
		});

		const draft = snake(teams.length, createdPools.length);

		const poolTeamValues: CreatePoolTeam[] = [];

		for (const [poolIdx, pool] of draft.entries()) {
			for (const [seedIdx, seed] of pool.entries()) {
				const team = teams.find((team) => team.seed === seed);

				if (!team) {
					throw badRequest(
						"Missing team with seed. Have you calculated seeds yet?",
					);
				}

				poolTeamValues.push({
					teamId: team.id,
					poolId: createdPools[poolIdx].id,
					seed: seedIdx + 1,
				});
			}
		}

		await db.insert(poolTeams).values(poolTeamValues);
	});

export const createPoolsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createPoolsSchema>) =>
			createPoolsFn({ data }),
	});

const POOL_MATCH_SETTINGS = {
  3: {
    sets: [
      21,
      21,
      15
    ],
    matches: [
      [1, 3],
      [2, 3],
      [1, 2],
    ]
	},
  4: {
    sets: [28],
    matches: [
      [1, 3],
      [2, 4],
      [1, 4],
      [2, 3],
      [3, 4],
      [1, 2],
    ]
  },
  5: {
    sets: [21],
    matches: [
      [3, 5],
      [1, 4],
      [2, 5],
      [1, 3],
      [2, 4],
      [1, 5],
      [2, 3],
      [4, 5],
      [1, 2],
      [3, 4],
    ]
	},
};

export const createPoolMatchesSchema = selectTournamentDivisionSchema
  .pick({
    id: true
  })
  .extend({
    overwrite: z.boolean()
  })

export const createPoolMatchesFn = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(createPoolMatchesSchema)
  .handler(async ({ data: { id: tournamentDivisionId, overwrite } }) => {
    const division = await db.query.tournamentDivisions.findFirst({
      with: {
        tournament: {
          columns: {
            startTime: true,
          }
        },
        pools: {
          with: {
            teams: true
          }
        }
      },
      where: (t, { eq }) => eq(t.id, tournamentDivisionId)
    })

    if (!division) {
      throw notFound()
    }

    // const pools = await db.query.pools.findMany({
    //   with: {
    //     teams: true,
    //   },
    //   where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId)
    // })

    if (overwrite) {
      await db
				.delete(poolMatches)
				// TODO: consider delete pool matches where pool.tournamentDivisionId eq to ensure no dangling matches
				.where(inArray(poolMatches.poolId, division.pools.map(({id}) => id)));
    }

    const matchValues: CreatePoolMatch[] = []
    const setValues: CreateMatchSet[] = []

    for (const { id, teams } of division.pools) {
      const { sets, matches } = [3, 4, 5].includes(teams.length) ?  POOL_MATCH_SETTINGS[teams.length as 3 | 4 | 5] : {
        /* TODO: fallback to permutations */
        sets: [],
        matches: []
      }

      for (const [matchIdx, [teamAId, teamBId]] of matches.entries()) {
        matchValues.push({
          poolId: id,
          matchNumber: matchIdx + 1,
          teamAId,
          teamBId,
          scheduledTime: matchIdx === 0 ? division.tournament.startTime : null,
        })

        setValues.push(...sets.map((winScore, setIdx) => ({
          poolMatchId: sql``,
          setNumber: setIdx + 1,
          winScore
        })))
      }
    }

    await db.insert(poolMatches).values(matchValues)
    await db.insert(matchSets).values(setValues)

    return {
      success: true as true
    }
  })


export const createPoolMatchesMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createPoolMatchesSchema>) =>
			createPoolMatchesFn({ data }),
	});
