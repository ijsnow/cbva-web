import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { accounts, userRelations, users } from "./auth";
import { blocks, pages } from "./blocks";
import { directorRelations, directors } from "./directors";
import { divisionRelations, divisions } from "./divisions";
import { levels } from "./levels";
import { matchRefTeams, matchRefTeamsRelations } from "./match-ref-teams";
import { matchRefs, matchRefsRelations } from "./match-refs";
import { matchSets, matchSetsRelations } from "./match-sets";
import { playerProfileRelations, playerProfiles } from "./player-profiles";
import { playoffMatches, playoffMatchRelations } from "./playoff-matches";
import { poolMatches, poolMatchRelations } from "./pool-matches";
import { poolTeams, poolTeamsRelations } from "./pool-teams";
import { poolRelations, pools } from "./pools";
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
import { venuesRelations, venues } from "./venues";
import { faqs } from "./faqs";
import { blogs } from "./blogs";
import type { relations } from "./relations";

export * from "./relations";

export * from "./auth";
export * from "./blocks";
export * from "./directors";
export * from "./divisions";
export * from "./levels";
export * from "./match-ref-teams";
export * from "./match-refs";
export * from "./match-sets";
export * from "./player-profiles";
export * from "./playoff-matches";
export * from "./pool-matches";
export * from "./pool-teams";
export * from "./pools";
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
export * from "./faqs";
export * from "./blogs";

export const tables = {
	blocks,
	directors,
	divisions,
	levels,
	matchSets,
	matchRefTeams,
	matchRefs,
	pages,
	playerProfiles,
	playoffMatches,
	poolMatches,
	pools,
	poolTeams,
	teamPlayers,
	teams,
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
	faqs,
	blogs,
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
	matchRefsRelations,
	poolTeamsRelations,
	teamPlayerRelations,
	teamRelations,
	tournamentDirectorRelations,
	tournamentDivisionRelations,
	tournamentDivisionRequirementsRelations,
	tournamentDivisionTeamsRelations,
	tournamentRelations,
	venuesRelations,
	venueDirectorRelations,
	userRelations,
};

const schema = {
	...tables,
	...relationships,
};

export type Database = PostgresJsDatabase<typeof schema, typeof relations>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
