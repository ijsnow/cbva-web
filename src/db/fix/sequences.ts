import "dotenv/config";

import { sql } from "drizzle-orm";
import { db } from "../connection";

/**
 * Resets the sequence for a PostgreSQL table to match the current max ID.
 * This is useful when sequences get out of sync after manual inserts or data imports.
 *
 * @param tableName - The name of the table
 * @param idColumn - The name of the ID column (defaults to 'id')
 */
async function resetSequence(tableName: string, idColumn = "id") {
	console.log("reset", tableName);

	await db.execute(
		sql.raw(`
			SELECT setval(
				pg_get_serial_sequence('${tableName}', '${idColumn}'),
				COALESCE((SELECT MAX(${idColumn}) FROM ${tableName}), 1),
				true
			)
		`),
	);

	console.log("done", tableName);
}

/**
 * Resets sequences for all tournament-related tables
 */
async function resetTournamentSequences() {
	await Promise.all([
		resetSequence("tournaments"),
		resetSequence("tournament_divisions"),
		resetSequence("tournament_directors"),
		resetSequence("tournament_division_requirements"),
		resetSequence("tournament_division_teams"),
		resetSequence("teams"),
		resetSequence("team_players"),
		resetSequence("match_sets"),
		resetSequence("playoff_matches"),
		resetSequence("pool_matches"),
		resetSequence("pools"),
		resetSequence("pool_teams"),
	]);
}

async function main() {
	await resetTournamentSequences();

	process.exit(0);
}

await main();
