import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import orderBy from "lodash/orderBy";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateMatchSet,
	matchSets,
	type PoolTeam,
	playoffMatches,
	selectTournamentDivisionSchema,
} from "@/db/schema";
import { draftPlayoffs, snakePlayoffs } from "@/lib/playoffs";
import { dbg } from "@/utils/dbg";
import { isNotNull } from "@/utils/types";

export type MatchKind = "set-to-21" | "set-to-28" | "best-of-3";

export const createPlayoffsSchema = selectTournamentDivisionSchema
	.pick({
		id: true,
	})
	.extend({
		teamCount: z.number(),
		wildcardCount: z.number(),
		matchKind: z.enum<MatchKind[]>(["set-to-21", "set-to-28", "best-of-3"]),
		overwrite: z.boolean(),
	});

const createPlayoffsFn = createServerFn()
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
			});

			const teams = orderBy(
				pools.flatMap(({ name, teams }) =>
					teams.map((team) => ({
						id: team.id,
						finish: team.finish,
						pool: name,
					})),
				),
				["finish", "pool"],
				["asc", "asc"],
			);

			const seededTeams = snakePlayoffs(
				teams.length,
				pools.map(({ id }) => id),
			).map(({ poolId, seed }) =>
				pools
					.find(({ id }) => id === poolId)
					?.teams.find(({ finish }) => finish === seed),
			);

			if (overwrite) {
				// Delete existing playoff matches if overwrite is true
				await db
					.delete(playoffMatches)
					.where(eq(playoffMatches.tournamentDivisionId, tournamentDivisionId));
			}

			const bracket = draftPlayoffs(teamCount + wildcardCount);

			await db.transaction(async (txn) => {
				const roundIds: (number | null)[][] = [];

				let matchNumber = 1;

				for (const [i, round] of bracket.entries()) {
					roundIds[i] = [];

					for (const match of round) {
						if (match) {
							const teamA: PoolTeam | null | undefined = match.aSeed
								? seededTeams[match.aSeed - 1]
								: null;

							const teamB: PoolTeam | null | undefined = match.bSeed
								? seededTeams[match.bSeed - 1]
								: null;

							const [{ id }] = await txn
								.insert(playoffMatches)
								.values({
									tournamentDivisionId,
									// round: text().notNull().default("-"),
									// court: text(),
									matchNumber,
									teamAId: teamA?.teamId,
									teamAPoolId: teamA?.poolId,
									teamAPreviousMatchId:
										match.aFrom && i > 0 ? roundIds[i - 1][match.aFrom] : null,

									teamBId: teamB?.teamId,
									teamBPoolId: teamB?.poolId,
									teamBPreviousMatchId:
										match.bFrom && i > 0 ? roundIds[i - 1][match.bFrom] : null,
								})
								.returning({
									id: playoffMatches.id,
								});

							roundIds[i].push(id);

							matchNumber += 1;
						} else {
							roundIds[i].push(null);
						}
					}
				}

				// TODO: set all the newly created playoffMatches.nextMatchId either using sql or one of the existing values saved from creating

				const matchSetValues: CreateMatchSet[] = roundIds
					.flatMap((ids) => dbg(ids).filter(isNotNull))
					.map((id) => dbg(id))
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
								],
					);

				await txn.insert(matchSets).values(matchSetValues);
			});

			return { success: true };
		},
	);

export const createPlayoffsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createPlayoffsSchema>) =>
			createPlayoffsFn({ data }),
	});

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
