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
			optional: false,
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
			optional: false,
		}),
		team: r.one.tournamentDivisionTeams({
			from: r.poolTeams.teamId,
			to: r.tournamentDivisionTeams.id,
			optional: false,
		}),
	},
	poolMatches: {
		sets: r.many.matchSets(),
		pool: r.one.pools({
			from: r.poolMatches.poolId,
			to: r.pools.id,
			optional: false,
		}),
		teamA: r.one.tournamentDivisionTeams({
			from: r.poolMatches.teamAId,
			to: r.tournamentDivisionTeams.id,
		}),
		teamB: r.one.tournamentDivisionTeams({
			from: r.poolMatches.teamBId,
			to: r.tournamentDivisionTeams.id,
		}),
		refs: r.many.matchRefs({
			from: r.poolMatches.id,
			to: r.matchRefs.poolMatchId,
		}),
	},
	playoffMatches: {
		sets: r.many.matchSets(),
		nextMatch: r.one.playoffMatches({
			from: r.playoffMatches.nextMatchId,
			to: r.playoffMatches.id,
		}),
		teamA: r.one.tournamentDivisionTeams({
			from: r.playoffMatches.teamAId,
			to: r.tournamentDivisionTeams.id,
		}),
		teamB: r.one.tournamentDivisionTeams({
			from: r.playoffMatches.teamBId,
			to: r.tournamentDivisionTeams.id,
		}),
		refs: r.many.matchRefs({
			from: r.playoffMatches.id,
			to: r.matchRefs.playoffMatchId,
		}),
	},
	matchSets: {
		poolMatch: r.one.poolMatches({
			from: r.matchSets.poolMatchId,
			to: r.poolMatches.id,
		}),
		playoffMatch: r.one.playoffMatches({
			from: r.matchSets.playoffMatchId,
			to: r.playoffMatches.id,
		}),
	},
	matchRefs: {
		poolMatch: r.one.poolMatches({
			from: r.matchRefs.poolMatchId,
			to: r.poolMatches.id,
		}),
		playoffMatch: r.one.playoffMatches({
			from: r.matchRefs.playoffMatchId,
			to: r.playoffMatches.id,
		}),
		profile: r.one.playerProfiles({
			from: r.matchRefs.profileId,
			to: r.playerProfiles.id,
		}),
		user: r.one.users({
			from: r.matchRefs.profileId.through(r.playerProfiles.id),
			to: r.users.id.through(r.playerProfiles.userId),
		}),
		team: r.one.tournamentDivisionTeams({
			from: r.matchRefs.teamId,
			to: r.tournamentDivisionTeams.id,
		}),
	},
	teams: {
		players: r.many.teamPlayers(),
		profiles: r.many.playerProfiles({
			from: r.teams.id.through(r.teamPlayers.teamId),
			to: r.playerProfiles.id.through(r.teamPlayers.playerProfileId),
		}),
	},
	teamPlayers: {
		profile: r.one.playerProfiles({
			from: r.teamPlayers.playerProfileId,
			to: r.playerProfiles.id,
			optional: false,
		}),
		team: r.one.teams({
			from: r.teamPlayers.teamId,
			to: r.teams.id,
			optional: false,
		}),
	},
	tournamentDivisionTeams: {
		team: r.one.teams({
			from: r.tournamentDivisionTeams.teamId,
			to: r.teams.id,
			optional: false,
		}),
		players: r.many.teamPlayers({
			from: r.tournamentDivisionTeams.teamId.through(r.teamPlayers.teamId),
			to: r.teamPlayers.id.through(r.teamPlayers.id),
		}),
		poolTeam: r.one.poolTeams({
			from: r.tournamentDivisionTeams.id,
			to: r.poolTeams.teamId,
		}),
		tournamentDivision: r.one.tournamentDivisions({
			from: r.tournamentDivisionTeams.tournamentDivisionId,
			to: r.tournamentDivisions.id,
			optional: false,
		}),
	},
	tournaments: {
		venue: r.one.venues({
			from: r.tournaments.venueId,
			to: r.venues.id,
			optional: false,
		}),
		directors: r.many.tournamentDirectors(),
		tournamentDivisions: r.many.tournamentDivisions(),
	},
	tournamentDirectors: {
		tournament: r.one.tournaments({
			from: r.tournamentDirectors.tournamentId,
			to: r.tournaments.id,
		}),
	},
	tournamentDivisions: {
		tournament: r.one.tournaments({
			from: r.tournamentDivisions.tournamentId,
			to: r.tournaments.id,
			optional: false,
		}),
		division: r.one.divisions({
			from: r.tournamentDivisions.divisionId,
			to: r.divisions.id,
			optional: false,
		}),
		pools: r.many.pools(),
		teams: r.many.tournamentDivisionTeams(),
	},
	venues: {
		tournaments: r.many.tournaments(),
	},
}));
