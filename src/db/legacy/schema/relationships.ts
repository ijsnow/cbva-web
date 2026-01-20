import { relations } from "drizzle-orm";

import {
	beaches,
	directorPreferences,
	emergencyContact,
	invitePlayers,
	invites,
	inviteTournaments,
	matchRefs,
	matchSets,
	phoneVerification,
	playoffMatches,
	poolMatches,
	pools,
	teamCanEdit,
	teamPlayerChanges,
	teamPlayerChangesNew,
	teamPlayerChangesOld,
	teamPlayers,
	teams,
	tournamentDirectors,
	tournamentInvites,
	tournaments,
	users,
} from "./tables";

// User relations
export const userRelations = relations(users, ({ many }) => ({
	directorPreferences: many(directorPreferences),
	emergencyContacts: many(emergencyContact),
	beachesDirected: many(beaches),
	tournamentInvites: many(tournamentInvites),
	teams: many(teamPlayers),
	teamCanEdit: many(teamCanEdit),
	teamPlayerChangesEdited: many(teamPlayerChanges),
	teamPlayerChangesOld: many(teamPlayerChangesOld),
	teamPlayerChangesNew: many(teamPlayerChangesNew),
	matchRefs: many(matchRefs),
	invitePlayers: many(invitePlayers),
	phoneVerifications: many(phoneVerification),
}));

export const phoneVerificationRelations = relations(
	phoneVerification,
	({ one }) => ({
		user: one(users, {
			fields: [phoneVerification.userId],
			references: [users.id],
		}),
	}),
);

// Director Preferences relations
export const directorPreferencesRelations = relations(
	directorPreferences,
	({ one, many }) => ({
		user: one(users, {
			fields: [directorPreferences.userId],
			references: [users.id],
		}),
		tournamentDirectors: many(tournamentDirectors),
	}),
);

// Emergency Contact relations
export const emergencyContactRelations = relations(
	emergencyContact,
	({ one }) => ({
		user: one(users, {
			fields: [emergencyContact.userId],
			references: [users.id],
		}),
	}),
);

// Beach relations
export const beachRelations = relations(beaches, ({ one, many }) => ({
	director: one(users, {
		fields: [beaches.directorId],
		references: [users.id],
	}),
	tournaments: many(tournaments),
}));

// Tournament relations
export const tournamentRelations = relations(tournaments, ({ one, many }) => ({
	beach: one(beaches, {
		fields: [tournaments.beachId],
		references: [beaches.id],
	}),
	scheduleTemplate: one(tournaments, {
		fields: [tournaments.scheduleTemplateId],
		references: [tournaments.id],
	}),
	tournamentDirectors: many(tournamentDirectors),
	tournamentInvites: many(tournamentInvites),
	teams: many(teams),
	pools: many(pools),
	playoffMatches: many(playoffMatches),
	invites: many(invites),
	inviteTournaments: many(inviteTournaments),
}));

// Tournament Directors relations
export const tournamentDirectorsRelations = relations(
	tournamentDirectors,
	({ one }) => ({
		tournament: one(tournaments, {
			fields: [tournamentDirectors.source],
			references: [tournaments.id],
		}),
		directorPreferences: one(directorPreferences, {
			fields: [tournamentDirectors.target],
			references: [directorPreferences.id],
		}),
	}),
);

// Tournament Invites relations
export const tournamentInvitesRelations = relations(
	tournamentInvites,
	({ one }) => ({
		tournament: one(tournaments, {
			fields: [tournamentInvites.tournamentId],
			references: [tournaments.id],
		}),
		user: one(users, {
			fields: [tournamentInvites.userId],
			references: [users.id],
		}),
	}),
);

// Team relations
export const teamRelations = relations(teams, ({ one, many }) => ({
	tournament: one(tournaments, {
		fields: [teams.tournamentId],
		references: [tournaments.id],
	}),
	pool: one(pools, {
		fields: [teams.poolId],
		references: [pools.id],
	}),
	players: many(teamPlayers),
	teamCanEdit: many(teamCanEdit),
	teamPlayerChanges: many(teamPlayerChanges),
	// poolMatchesAsTeamA: many(poolMatches, { relationName: "teamA" }),
	// poolMatchesAsTeamB: many(poolMatches, { relationName: "teamB" }),
	// playoffMatchesAsTeamA: many(playoffMatches, { relationName: "teamA" }),
	// playoffMatchesAsTeamB: many(playoffMatches, { relationName: "teamB" }),
}));

export const teamPlayerRelations = relations(teamPlayers, ({ one }) => ({
	user: one(users, {
		fields: [teamPlayers.target],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [teamPlayers.source],
		references: [teams.id],
	}),
}));

// Team Can Edit relations
export const teamCanEditRelations = relations(teamCanEdit, ({ one }) => ({
	team: one(teams, {
		fields: [teamCanEdit.teamId],
		references: [teams.id],
	}),
	user: one(users, {
		fields: [teamCanEdit.userId],
		references: [users.id],
	}),
}));

// Team Player Changes relations
export const teamPlayerChangesRelations = relations(
	teamPlayerChanges,
	({ one, many }) => ({
		team: one(teams, {
			fields: [teamPlayerChanges.teamId],
			references: [teams.id],
		}),
		editor: one(users, {
			fields: [teamPlayerChanges.editorId],
			references: [users.id],
		}),
		oldPlayers: many(teamPlayerChangesOld),
		newPlayers: many(teamPlayerChangesNew),
	}),
);

// Team Player Changes Old relations
export const teamPlayerChangesOldRelations = relations(
	teamPlayerChangesOld,
	({ one }) => ({
		teamPlayerChange: one(teamPlayerChanges, {
			fields: [teamPlayerChangesOld.teamPlayerChangeId],
			references: [teamPlayerChanges.id],
		}),
		user: one(users, {
			fields: [teamPlayerChangesOld.userId],
			references: [users.id],
		}),
	}),
);

// Team Player Changes New relations
export const teamPlayerChangesNewRelations = relations(
	teamPlayerChangesNew,
	({ one }) => ({
		teamPlayerChange: one(teamPlayerChanges, {
			fields: [teamPlayerChangesNew.teamPlayerChangeId],
			references: [teamPlayerChanges.id],
		}),
		user: one(users, {
			fields: [teamPlayerChangesNew.userId],
			references: [users.id],
		}),
	}),
);

// Pool relations
export const poolRelations = relations(pools, ({ one, many }) => ({
	tournament: one(tournaments, {
		fields: [pools.tournamentId],
		references: [tournaments.id],
	}),
	teams: many(teams),
	poolMatches: many(poolMatches),
	// playoffMatchesFromA: many(playoffMatches, { relationName: "aFromPool" }),
	// playoffMatchesFromB: many(playoffMatches, { relationName: "bFromPool" }),
}));

// Pool Match relations
export const poolMatchRelations = relations(poolMatches, ({ one, many }) => ({
	pool: one(pools, {
		fields: [poolMatches.poolId],
		references: [pools.id],
	}),
	teamA: one(teams, {
		fields: [poolMatches.teamAId],
		references: [teams.id],
		relationName: "teamA",
	}),
	teamB: one(teams, {
		fields: [poolMatches.teamBId],
		references: [teams.id],
		relationName: "teamB",
	}),
	matchRefs: many(matchRefs),
	matchSets: many(matchSets),
}));

// Playoff Match relations
export const playoffMatchRelations = relations(
	playoffMatches,
	({ one, many }) => ({
		tournament: one(tournaments, {
			fields: [playoffMatches.tournamentId],
			references: [tournaments.id],
		}),
		teamA: one(teams, {
			fields: [playoffMatches.teamAId],
			references: [teams.id],
			relationName: "teamA",
		}),
		teamB: one(teams, {
			fields: [playoffMatches.teamBId],
			references: [teams.id],
			relationName: "teamB",
		}),
		// // TODO: figure out these relationships
		// aFromMatch: one(playoffMatches, {
		//   fields: [playoffMatches.aFromMatchId],
		//   references: [playoffMatches.id],
		//   relationName: "aFromMatch",
		// }),
		// aFromPool: one(pools, {
		//   fields: [playoffMatches.aFromPoolId],
		//   references: [pools.id],
		//   relationName: "aFromPool",
		// }),
		// bFromMatch: one(playoffMatches, {
		//   fields: [playoffMatches.bFromMatchId],
		//   references: [playoffMatches.id],
		//   relationName: "bFromMatch",
		// }),
		// bFromPool: one(pools, {
		//   fields: [playoffMatches.bFromPoolId],
		//   references: [pools.id],
		//   relationName: "bFromPool",
		// }),
		// refFrom: one(playoffMatches, {
		//   fields: [playoffMatches.refFromId],
		//   references: [playoffMatches.id],
		// }),
		matchRefs: many(matchRefs),
		matchSets: many(matchSets),
		// aFromMatches: many(playoffMatches, { relationName: "aFromMatch" }),
		// bFromMatches: many(playoffMatches, { relationName: "bFromMatch" }),
		refFromMatches: many(playoffMatches),
	}),
);

// Match Refs relations
export const matchRefsRelations = relations(matchRefs, ({ one }) => ({
	user: one(users, {
		fields: [matchRefs.userId],
		references: [users.id],
	}),
}));

// Match Sets relations
export const matchSetsRelations = relations(matchSets, ({ one }) => ({
	poolMatch: one(poolMatches, {
		fields: [matchSets.forMatchId],
		references: [poolMatches.id],
	}),
	playoffMatch: one(playoffMatches, {
		fields: [matchSets.forMatchId],
		references: [playoffMatches.id],
	}),
}));

// Invite relations
export const inviteRelations = relations(invites, ({ one, many }) => ({
	sourceTournament: one(tournaments, {
		fields: [invites.sourceTournamentId],
		references: [tournaments.id],
	}),
	inviteTournaments: many(inviteTournaments),
	invitePlayers: many(invitePlayers),
}));

// Invite Tournaments relations
export const inviteTournamentsRelations = relations(
	inviteTournaments,
	({ one }) => ({
		invite: one(invites, {
			fields: [inviteTournaments.inviteId],
			references: [invites.id],
		}),
		tournament: one(tournaments, {
			fields: [inviteTournaments.tournamentId],
			references: [tournaments.id],
		}),
	}),
);

// Invite Players relations
export const invitePlayersRelations = relations(invitePlayers, ({ one }) => ({
	invite: one(invites, {
		fields: [invitePlayers.inviteId],
		references: [invites.id],
	}),
	user: one(users, {
		fields: [invitePlayers.userId],
		references: [users.id],
	}),
}));
