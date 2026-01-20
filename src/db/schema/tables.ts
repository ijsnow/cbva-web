import { accounts, users } from "./auth";
import { blocks, pages } from "./blocks";
import { directors } from "./directors";
import { divisions } from "./divisions";
import { levels } from "./levels";
import { matchRefTeams } from "./match-ref-teams";
import { matchRefs } from "./match-refs";
import { matchSets } from "./match-sets";
import { playerProfiles } from "./player-profiles";
import { playoffMatches } from "./playoff-matches";
import { poolMatches } from "./pool-matches";
import { poolTeams } from "./pool-teams";
import { pools } from "./pools";
import { rateLimiterFlexibleSchema } from "./rate-limits";
import { teamPlayers } from "./team-players";
import { teams } from "./teams";
import { tournamentDirectors } from "./tournament-directors";
import { tournamentDivisionRequirements } from "./tournament-division-requirements";
import { tournamentDivisionTeams } from "./tournament-division-teams";
import { tournamentDivisions } from "./tournament-divisions";
import { tournaments } from "./tournaments";
import { venueDirectors } from "./venue-directors";
import { venues } from "./venues";
import { faqs } from "./faqs";

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
};
