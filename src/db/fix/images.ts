import "dotenv/config";

import { eq, sql } from "drizzle-orm";
import { db } from "../connection";
import { venues } from "../schema";

const STORAGE_URL = `${process.env.VITE_SUPABASE_STORAGE_URL}/storage/v1/object/public`;

async function main() {
	const res = await db
		.select({
			id: venues.id,
			headerImageSource: venues.headerImageSource,
			thumbnailImageSource: venues.thumbnailImageSource,
		})
		.from(venues);

	const fixed = res
		.map(({ id, headerImageSource, thumbnailImageSource }) => ({
			id,
			headerImageSource: headerImageSource?.split("https")[2],
			thumbnailImageSource: thumbnailImageSource?.split("https")[2],
		}))
		.map(({ id, headerImageSource, thumbnailImageSource }) => ({
			id,
			headerImageSource: headerImageSource ? `https${headerImageSource}` : null,
			thumbnailImageSource: thumbnailImageSource
				? `https${thumbnailImageSource}`
				: null,
		}));

	await Promise.all(
		fixed.map(({ id, ...values }) =>
			db.update(venues).set(values).where(eq(venues.id, id)),
		),
	);

	process.exit(0);
}

await main();
