import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import { eq, inArray } from "drizzle-orm";
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuidv4 } from "uuid";
import { db } from "../connection";
import { type UpdateVenue, venues } from "../schema";
import { files } from "../schema/files";

async function main() {
	const results = await db.query.venues.findMany({
		columns: {
			id: true,
			imageSource: true,
		},
	});

	const updates = results
		.filter((d) => d.imageSource && d.imageSource.startsWith("/api/files"))
		.map(({ id, imageSource }) => ({
			id,
			fileId: Number.parseInt(imageSource!.split("=")[1], 10),
		}));

	const filesToMove = (
		await db
			.select()
			.from(files)
			.where(
				inArray(
					files.id,
					updates.map(({ fileId }) => fileId),
				),
			)
	).map(({ id, bytes }) => ({
		id,
		bytes,
		venueId: updates.find(({ fileId }) => fileId === id)?.id as number,
	}));

	// const supabase = getSupabaseServerClient();

	const supabase = createClient(
		process.env.VITE_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
	);

	const timestamp = Date.now();

	const venueUpdates: { [key: number]: UpdateVenue } = {};

	for (const { id, bytes, venueId } of filesToMove) {
		const fileType = await fileTypeFromBuffer(bytes);
		if (!fileType) {
			throw new Error("could not determine file type");
		}

		for (const prefix of ["headers", "thumbnails"]) {
			const uniqueId = uuidv4();
			const fileName = `${uniqueId}-${timestamp}-file-${id}.${fileType.ext}`;
			const storagePath = `${venueId}/${prefix}/${fileName}`;

			const res = await supabase.storage
				.from("venues")
				.upload(storagePath, bytes, {
					contentType: fileType.mime,
				});

			if (res.error) {
				throw res.error;
			}

			if (!venueUpdates[venueId]) {
				venueUpdates[venueId] = {};
			}

			if (prefix === "headers") {
				venueUpdates[venueId].headerImageSource = storagePath;
			} else {
				venueUpdates[venueId].thumbnailImageSource = storagePath;
			}

			console.log("uploaded", storagePath);
		}
	}

	console.log(JSON.stringify(venueUpdates, null, 2));

	await Promise.all(
		Object.keys(venueUpdates).map((key) => {
			const venueId = Number.parseInt(key, 10);

			return db
				.update(venues)
				.set(venueUpdates[venueId])
				.where(eq(venues.id, venueId));
		}),
	);

	process.exit(0);
}

await main();
