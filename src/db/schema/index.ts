import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { accounts, users } from "./auth";
import { blocks, pages } from "./blocks";
import { directorRelations, directors } from "./directors";
import { divisionRelations, divisions } from "./divisions";
import { levels } from "./levels";
import { matchRefTeams, matchRefTeamsRelations } from "./match-ref-teams";
import { matchSets, matchSetsRelations } from "./match-sets";
import { playerProfileRelations, playerProfiles } from "./player-profiles";
import { playoffMatches, playoffMatchRelations } from "./playoff-matches";
import { poolMatches, poolMatchRelations } from "./pool-matches";
import { poolTeams, poolTeamsRelations } from "./pool-teams";
import { poolRelations, pools } from "./pools";
import { projects, todos } from "./projects";
import { rateLimiterFlexibleSchema } from "./rate-limits";
import { teamPlayerRelations, teamPlayers } from "./team-players";
import { teamRelations, teams } from "./teams";
import {
	tournamentDirectorRelations,
	tournamentDirectors,
} from "./tournament-directors";
import {
	tournamentDivisionRequirements,
	tournamentDivisionRequirementsRelations,
} from "./tournament-division-requirements";
import {
	tournamentDivisionTeams,
	tournamentDivisionTeamsRelations,
} from "./tournament-division-teams";
import {
	tournamentDivisionRelations,
	tournamentDivisions,
} from "./tournament-divisions";
import { tournamentRelations, tournaments } from "./tournaments";
import { venueDirectorRelations, venueDirectors } from "./venue-directors";
import { venueRelations, venues } from "./venues";

export * from "./auth";
export * from "./blocks";
export * from "./directors";
export * from "./divisions";
export * from "./levels";
export * from "./match-ref-teams";
export * from "./match-sets";
export * from "./player-profiles";
export * from "./playoff-matches";
export * from "./pool-matches";
export * from "./pool-teams";
export * from "./pools";
export * from "./projects";
export * from "./rate-limits";
export * from "./team-players";
export * from "./teams";
export * from "./tournament-directors";
export * from "./tournament-division-requirements";
export * from "./tournament-division-teams";
export * from "./tournament-divisions";
export * from "./tournaments";
export * from "./venue-directors";
export * from "./venues";

export const tables = {
	blocks,
	directors,
	divisions,
	levels,
	matchSets,
	matchRefTeams,
	pages,
	playerProfiles,
	playoffMatches,
	poolMatches,
	pools,
	poolTeams,
	projects,
	teamPlayers,
	teams,
	todos,
	tournamentDirectors,
	tournamentDivisionRequirements,
	tournamentDivisions,
	tournamentDivisionTeams,
	tournaments,
	users,
	accounts,
	venues,
	venueDirectors,
	rateLimiterFlexibleSchema,
};

export const relationships = {
	directorRelations,
	divisionRelations,
	matchSetsRelations,
	playerProfileRelations,
	playoffMatchRelations,
	poolMatchRelations,
	poolRelations,
	matchRefTeamsRelations,
	poolTeamsRelations,
	teamPlayerRelations,
	teamRelations,
	tournamentDirectorRelations,
	tournamentDivisionRelations,
	tournamentDivisionRequirementsRelations,
	tournamentDivisionTeamsRelations,
	tournamentRelations,
	venueRelations,
	venueDirectorRelations,
};

const schema = {
	...tables,
	...relationships,
};

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
