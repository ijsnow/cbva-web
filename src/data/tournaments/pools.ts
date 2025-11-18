import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, inArray } from "drizzle-orm";
import range from "lodash/range";
import z from "zod";

import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateMatchSet,
	type CreatePoolMatch,
	type CreatePoolTeam,
	matchSets,
	type PoolTeam,
	poolMatches,
	pools,
	poolTeams,
	selectPoolSchema,
	selectTournamentDivisionSchema,
} from "@/db/schema";
import { getPoolStats } from "@/hooks/matches";
import { badRequest } from "@/lib/responses";
import { snake } from "@/lib/snake-draft";

export const createPoolsSchema = selectTournamentDivisionSchema
	.pick({
		id: true,
	})
	.extend({
		count: z.number(),
		overwrite: z.boolean(),
	});

export const createPoolsFn = createServerFn()
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

		if (overwrite) {
			await db
				.delete(pools)
				.where(eq(pools.tournamentDivisionId, tournamentDivisionId));
		}

		const createdPools = await db
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
		sets: [21, 21, 15],
		matches: [
			[1, 3],
			[2, 3],
			[1, 2],
		],
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
		],
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
		],
	},
};

export const createPoolMatchesSchema = selectTournamentDivisionSchema
	.pick({
		tournamentId: true,
	})
	.extend({
		overwrite: z.boolean(),
	});

export const createPoolMatchesFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(createPoolMatchesSchema)
	.handler(async ({ data: { tournamentId, overwrite } }) => {
		const divisions = await db.query.tournamentDivisions.findMany({
			with: {
				tournament: {
					columns: {
						startTime: true,
					},
				},
				pools: {
					with: {
						teams: true,
					},
				},
			},
			where: (t, { eq }) => eq(t.tournamentId, tournamentId),
		});

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
				.where(
					inArray(
						poolMatches.poolId,
						divisions.flatMap((division) => division.pools.map(({ id }) => id)),
					),
				);
		}

		const matchValues: CreatePoolMatch[] = [];

		const poolMatchSetsSettings: { [id: number]: number[] } = {};

		for (const division of divisions) {
			for (const { id, teams } of division.pools) {
				const { sets, matches } = [3, 4, 5].includes(teams.length)
					? POOL_MATCH_SETTINGS[teams.length as 3 | 4 | 5]
					: {
							/* TODO: fallback to permutations */
							sets: [],
							matches: [],
						};

				poolMatchSetsSettings[id] = sets;

				for (const [matchIdx, [teamASeed, teamBSeed]] of matches.entries()) {
					const teamAId = teams.find((team) => teamASeed === team.seed)?.teamId;
					const teamBId = teams.find((team) => teamBSeed === team.seed)?.teamId;

					matchValues.push({
						poolId: id,
						matchNumber: matchIdx + 1,
						teamAId,
						teamBId,
						scheduledTime:
							matchIdx === 0 ? division.tournament.startTime : null,
					});
				}
			}
		}

		// Create pool matches first and get their IDs
		const createdMatches = await db
			.insert(poolMatches)
			.values(matchValues)
			.returning({ id: poolMatches.id, poolId: poolMatches.poolId });

		// Now create match sets with correct poolMatchId references
		const setValues: CreateMatchSet[] = createdMatches.flatMap(
			({ id, poolId }) =>
				poolMatchSetsSettings[poolId].map((winScore, setIdx) => ({
					poolMatchId: id,
					setNumber: setIdx + 1,
					winScore,
				})),
		);

		await db.insert(matchSets).values(setValues);

		return {
			success: true as true,
		};
	});

export const createPoolMatchesMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createPoolMatchesSchema>) =>
			createPoolMatchesFn({ data }),
	});

export const setPoolCourtSchema = selectPoolSchema
	.pick({
		id: true,
	})
	.extend({
		court: z.string(),
	});

export const setPoolCourtFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(setPoolCourtSchema)
	.handler(async ({ data: { id, court } }) => {
		await db
			.update(pools)
			.set({
				court,
			})
			.where(eq(pools.id, id));

		return {
			success: true as true,
		};
	});

export const setPoolCourtMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof setPoolCourtSchema>) =>
			setPoolCourtFn({ data }),
	});

export const completePoolsSchema = selectTournamentDivisionSchema.pick({
	id: true,
});

export const completePoolsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(completePoolsSchema)
	.handler(async ({ data: { id: tournamentDivisionId } }) => {
		// Get all pools for this tournament division with their teams and completed matches
		const poolsData = await db.query.pools.findMany({
			with: {
				teams: {
					columns: {
						id: true,
						teamId: true,
						seed: true,
						finish: true,
					},
				},
				matches: {
					with: {
						sets: {
							columns: {
								teamAScore: true,
								teamBScore: true,
								winnerId: true,
							},
						},
					},
					columns: {
						id: true,
						teamAId: true,
						teamBId: true,
						winnerId: true,
					},
				},
			},
			where: (p, { eq }) => eq(p.tournamentDivisionId, tournamentDivisionId),
		});

		const updates: Pick<PoolTeam, "id" | "finish">[] = [];

		// Calculate finish positions for each pool
		for (const pool of poolsData) {
			const stats = getPoolStats({
				teams: pool.teams,
				matches: pool.matches,
			});

			if (!stats) {
				// Skip pools without completed matches
				continue;
			}

			// Update finish positions for each team in the pool
			for (const team of pool.teams) {
				const teamStats = stats[team.teamId];

				if (teamStats) {
					updates.push({ id: team.id, finish: teamStats.rank });
				}
			}
		}

		await db.transaction(async (txn) => {
			await Promise.all(
				updates.map(({ id, ...values }) =>
					txn.update(poolTeams).set(values).where(eq(poolTeams.id, id)),
				),
			);
		});

		return {
			success: true as true,
		};
	});

export const completePoolsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof completePoolsSchema>) =>
			completePoolsFn({ data }),
	});
