import { db } from "../connection";
import { legacy } from "../legacy";
import { seedDivisions, seedLevels } from "../seed/divisions";
import { importDirectors } from "./directors";
import { importPlayers } from "./players";
import { importTournamentsForYear } from "./tournaments";
import { importUsers } from "./users";
import { getVenuesCache } from "./venues";

async function main() {
	const earliest = await legacy.query.tournaments.findFirst({
		orderBy: (tournaments, { asc }) => [asc(tournaments.startAt)],
	});

	const startYear = earliest?.startAt.getFullYear();

	if (!startYear) {
		throw new Error("Could not determine start year.");
	}

	const currentYear = new Date().getFullYear();

	const tournamentKeyCache = new Map<string, number>();

	const divisionsCache = await seedDivisions(db);
	const levelsCache = await seedLevels(db);

	// await importPlayers(levelsCache);
	await importUsers(levelsCache);
	await importDirectors();

	const venuesCache = await getVenuesCache();

	// console.log("divisions", Array.from(divisionsCache.entries()));

	// TODO: populate cache with existing

	for (let year = currentYear; year >= startYear; year--) {
		await importTournamentsForYear(
			year,
			tournamentKeyCache,
			venuesCache,
			divisionsCache,
			levelsCache,
		);

		// await importTeamsForYear(year, venuesCache, divisionsCache, levelsCache);
		// await importGames(year);
	}
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
