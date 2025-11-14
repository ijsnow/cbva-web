import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import orderBy from "lodash/orderBy";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateMatchSet,
	type CreatePlayoffMatch,
	matchSets,
	playoffMatches,
	pools,
	selectTournamentDivisionSchema,
} from "@/db/schema";
import { badRequest } from "@/lib/responses";
import { snake, snake2 } from "@/lib/snake-draft";

export type MatchKind = "set-to-21" | "set-to-28" | "best-of-3";

export const createPlayoffsSchema = selectTournamentDivisionSchema
	.pick({
		id: true,
	})
	.extend({
		count: z.number(),
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
			data: { id: tournamentDivisionId, count, matchKind, overwrite },
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

			const trimmedCount = count - (count % pools.length);
			const roundedCount = trimmedCount - (trimmedCount % 2);

			const draft = snake2(teams.slice(0, roundedCount), [
				{
					id: 0,
				},
				{
					id: 1,
				},
			]);

			console.log(teams, JSON.stringify(draft, null, 2));

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

			// ...

			// if (overwrite) {
			// 	await db
			// 		.delete(playoffMatches)
			// 		.where(eq(playoffMatches.tournamentDivisionId, tournamentDivisionId));
			// }

			// // Sort teams by pool and finish position
			// const firstPlaceTeams = teams
			// 	.filter((team) => team.finish === 1)
			// 	.sort((a, b) => a.poolId - b.poolId);

			// const secondPlaceTeams = teams
			// 	.filter((team) => team.finish === 2)
			// 	.sort((a, b) => a.poolId - b.poolId);

			// // Cross-bracket: 1st place teams go in top bracket, 2nd place in bottom
			// const bracketTeams = [...firstPlaceTeams, ...secondPlaceTeams];

			// // Create playoff matches using snake draft
			// const bracket = snake(bracketTeams.length, count);

			// const matchInserts: CreatePlayoffMatch[] = [];
			// const setInserts: CreateMatchSet[] = [];

			// for (let i = 0; i < bracket.length; i++) {
			// 	const matchTeams = bracket[i];

			// 	if (matchTeams.length !== 2) {
			// 		// Skip incomplete matches (byes)
			// 		continue;
			// 	}

			// 	const match: CreatePlayoffMatch = {
			// 		tournamentDivisionId,
			// 		round: 1,
			// 		matchNumber: i + 1,
			// 		teamAId: matchTeams[0].id,
			// 		teamBId: matchTeams[1].id,
			// 	};

			// 	matchInserts.push(match);

			// 	// Create match sets based on match kind
			// 	let setCount = 1;
			// 	if (matchKind === "best-of-3") {
			// 		setCount = 3;
			// 	}

			// 	for (let setNum = 1; setNum <= setCount; setNum++) {
			// 		const set: CreateMatchSet = {
			// 			playoffMatchId: 0, // Will be updated after match insert
			// 			setNumber: setNum,
			// 			teamAScore: null,
			// 			teamBScore: null,
			// 		};
			// 		setInserts.push(set);
			// 	}
			// }

			// // Insert matches and sets
			// for (const match of matchInserts) {
			// 	const [insertedMatch] = await db
			// 		.insert(playoffMatches)
			// 		.values(match)
			// 		.returning({ id: playoffMatches.id });

			// 	// Update sets with the correct match ID
			// 	for (const set of setInserts.filter((s) => s.playoffMatchId === 0)) {
			// 		set.playoffMatchId = insertedMatch.id;
			// 	}
			// }

			// // Insert all sets
			// if (setInserts.length > 0) {
			// 	await db.insert(matchSets).values(setInserts);
			// }

			return { success: true /*matchesCreated: matchInserts.length*/ };
		},
	);

export const createPlayoffsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createPlayoffsSchema>) =>
			createPlayoffsFn({ data }),
	});
