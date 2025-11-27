import { chunk, groupBy, uniqBy } from "lodash-es";
import { db } from "../connection";
import { legacy } from "../legacy";
import {
	type PlayerProfile,
	type playerProfiles,
	poolTeams,
	type Team,
	type TeamPlayer,
	teamPlayers,
	teams,
	tournamentDivisionTeams,
} from "../schema";
import { mapDivision } from "./shared";

function mapTeamStatus(
	status: string,
): "registered" | "waitlisted" | "confirmed" | "cancelled" {
	switch (status.toLowerCase()) {
		case "active":
			return "confirmed";
		case "waitlisted":
			return "waitlisted";
		case "withdrawn":
		case "forfeited":
		case "noshowed":
		case "latewithdrawn":
			return "cancelled";
		default:
			return "registered";
	}
}

export async function importTeamsForYear(
	year: number,
	venues: Map<string, number>,
	divisions: Map<string, number>,
	levels: Map<string, number>,
) {
	const tournaments = await legacy.query.tournaments.findMany({
		where: (t, { gte, lt, ne, and }) =>
			and(
				gte(t.startAt, new Date(`${year}-01-01`)),
				lt(t.startAt, new Date(`${year + 1}-01-01`)),
				ne(t.status, "Schedule"),
				ne(t.status, "Cancelled"),
			),
		with: {
			teams: {
				with: {
					players: {
						with: {
							user: true,
						},
					},
				},
			},
		},
	});

	const venuesRev = new Map(
		Array.from(venues.entries()).map(([uuid, id]) => [id, uuid]),
	);

	const divisionsRev = new Map(
		Array.from(divisions.entries()).map(([uuid, id]) => [id, uuid]),
	);

	const { td: tournamentDivisions, p: pools } = (
		await db.query.tournaments.findMany({
			where: (t, { gte, lt, and }) =>
				and(gte(t.date, `${year}-01-01`), lt(t.date, `${year + 1}-01-01`)),
			with: {
				tournamentDivisions: {
					with: {
						pools: true,
					},
				},
			},
		})
	).reduce<{ td: { [key: string]: number }; p: { [key: string]: number } }>(
		(memo, t) => {
			for (const td of t.tournamentDivisions) {
				const key = [
					venuesRev.get(t.venueId),
					td.name,
					t.date,
					divisionsRev.get(td.divisionId),
					td.gender,
				].join(":");

				memo.td[key] = td.id;

				for (const p of td.pools) {
					memo.p[p.externalRef] = p.id;
				}
			}

			return memo;
		},
		{ td: {}, p: {} },
	);

	const playersMap = (
		await db.query.playerProfiles.findMany({
			columns: {
				id: true,
				externalRef: true,
			},
		})
	).reduce((memo, p) => {
		memo.set(p.externalRef, p.id);

		return memo;
	}, new Map<string, number>());

	const teamsToCreateAndPlayers: (typeof teams.$inferInsert & {
		players: number[];
	})[] = uniqBy(
		tournaments.flatMap(({ teams }) =>
			teams.map((t) => {
				const players = t.players.map(
					({ user }) => playersMap.get(user.id) as number,
				);

				players.sort();

				return {
					name: players.join(":"),
					players,
				};
			}),
		),
		(a) => a.name,
	);

	const teamsToCreate: (typeof teams.$inferInsert)[] =
		teamsToCreateAndPlayers.map(({ players, ...team }) => team);

	const teamsMap = new Map<string, number>();

	for (const batch of chunk(teamsToCreate, 500)) {
		console.log(`teams(${year}): inserting batch of size ${batch.length}`);

		const result = await db
			.insert(teams)
			.values(batch)
			.returning({ id: teams.id, name: teams.name });

		for (const row of result) {
			teamsMap.set(row.name as string, row.id);
		}
	}

	const teamPlayersToCreate: (typeof teamPlayers.$inferInsert)[] =
		teamsToCreateAndPlayers.flatMap(({ name: teamRef, players }) =>
			players.map((p) => ({
				teamId: teamsMap.get(teamRef as string) as TeamPlayer["teamId"],
				playerProfileId: p,
			})),
		);

	for (const batch of chunk(teamPlayersToCreate, 500)) {
		console.log(
			`team_players(${year}): inserting batch of size ${batch.length}`,
		);

		await db.insert(teamPlayers).values(batch);
	}

	const tdTeamsToCreate: (typeof tournamentDivisionTeams.$inferInsert & {
		poolTeam: Omit<typeof poolTeams.$inferInsert, "teamId"> | null;
	})[] = tournaments.flatMap(
		({ name, startAt, beachId, teams, division, gender }) =>
			teams.map((t) => {
				const key = [
					beachId,
					name,
					startAt.toISOString().split("T")[0],
					mapDivision(division),
					gender.toLowerCase(),
				].join(":");

				const teamKey = t.players
					.map((p) => playersMap.get(p.user.id) as number)
					.sort()
					.join(":");

				return {
					teamId: teamsMap.get(teamKey) as number,
					tournamentDivisionId: tournamentDivisions[key] as number,
					seed: t.seed,
					finish: t.finish,
					pointsEarned: t.pointsEarned,
					ratingEarned: t.ratingEarned,
					status: mapTeamStatus(t.status),
					externalRef: t.id,
					poolTeam: t.poolId
						? {
								poolId: pools[t.poolId] as number,
								seed: t.poolSeed,
							}
						: null,
				};
			}),
	);

	for (const batch of chunk(tdTeamsToCreate, 500)) {
		console.log(
			`tournament_division_teams(${year}): inserting batch of size ${batch.length}`,
		);

		const poolTeamsToCreate = batch
			.filter((v) => Boolean(v.poolTeam))
			.map(
				({ externalRef, poolTeam }) =>
					[externalRef, poolTeam] as [
						string,
						Omit<
							{
								teamId: number;
								poolId: number;
								id?: number | undefined;
								seed?: number | null | undefined;
								finish?: number | null | undefined;
							},
							"teamId"
						>,
					],
			);

		const map = (
			await db.insert(tournamentDivisionTeams).values(batch).returning({
				id: tournamentDivisionTeams.id,
				externalRef: tournamentDivisionTeams.externalRef,
			})
		).reduce<{ [key: string]: number }>((memo, { id, externalRef }) => {
			memo[externalRef] = id;
			return memo;
		}, {});

		if (poolTeamsToCreate.length) {
			await db
				.insert(poolTeams)
				.values(
					poolTeamsToCreate
						.filter((t) => Boolean(t))
						.map(([externalRef, poolTeam]) => ({
							...poolTeam,
							teamId: map[externalRef] as number,
						})),
				)
				.returning({
					id: tournamentDivisionTeams.id,
				});
		}
	}
}
