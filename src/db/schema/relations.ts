import { defineRelations } from "drizzle-orm";
import { tables } from "./tables";

export const relations = defineRelations(tables, (r) => ({
	playerProfiles: {
		user: r.one.users({
			from: r.playerProfiles.userId,
			to: r.users.id,
		}),
		level: r.one.levels({
			from: r.playerProfiles.levelId,
			to: r.levels.id,
		}),
	},
	pools: {
		tournamentDivision: r.one.tournamentDivisions({
			from: r.pools.tournamentDivisionId,
			to: r.tournamentDivisions.id,
		}),
		teams: r.many.poolTeams(),
		// tournamentDivisionTeams: r.many.tournamentDivisionTeams({
		// 	from: r.pools.id.through(r.poolTeams.poolId),
		// 	to: r.tournamentDivisionTeams.id.through(r.poolTeams.teamId),
		// }),
		matches: r.many.poolMatches(),
	},
	poolTeams: {
		pool: r.one.pools({
			from: r.poolTeams.poolId,
			to: r.pools.id,
		}),
		team: r.one.tournamentDivisionTeams({
			from: r.poolTeams.teamId,
			to: r.tournamentDivisionTeams.id,
			optional: false,
		}),
	},
	poolMatches: {
		pool: r.one.pools({
			from: r.poolMatches.poolId,
			to: r.pools.id,
		}),
	},
	tournamentDivisionTeams: {
		team: r.one.teams({
			from: r.tournamentDivisionTeams.teamId,
			to: r.teams.id,
		}),
		poolTeam: r.one.poolTeams({
			from: r.tournamentDivisionTeams.id,
			to: r.poolTeams.teamId,
		}),
	},
	tournaments: {
		venue: r.one.venues({
			from: r.tournaments.venueId,
			to: r.venues.id,
			optional: false,
		}),
	},
	venues: {
		tournaments: r.many.tournaments(),
	},
}));
