import "dotenv/config";

import { readFileSync, readSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { db } from "../connection";
import { venues } from "../schema";

const STORAGE_URL = `${process.env.VITE_SUPABASE_STORAGE_URL}/storage/v1/object/public`;

async function main() {
	await db.update(venues).set({
		headerImageSource: sql`${STORAGE_URL} || '/venues/' || ${venues.headerImageSource}`,
		thumbnailImageSource: sql`${STORAGE_URL} || '/venues/' || ${venues.thumbnailImageSource}`,
	});

	// const prodEnvBuf = readFileSync("./.env.prod");
	// const prodEnv = dotenv.parse(prodEnvBuf);

	// const supabase = createClient(
	// 	prodEnv.VITE_SUPABASE_URL!,
	// 	prodEnv.SUPABASE_SERVICE_ROLE_KEY!,
	// );

	process.exit(0);
}

await main();
