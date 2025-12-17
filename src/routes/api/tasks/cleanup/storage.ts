import { createFileRoute } from "@tanstack/react-router";
import { db, type schema } from "@/db/connection";
import type { Database } from "@/db/schema";
import { internalServerError } from "@/lib/responses";
import { getSupabaseServerClient } from "@/supabase/server";
import { isNotNullOrUndefined } from "@/utils/types";

async function walk(
	supabase: ReturnType<typeof getSupabaseServerClient>,
	bucketName: string,
	path?: string,
) {
	const files = await supabase.storage.from(bucketName).list(path);
	if (files.error) {
		throw internalServerError(files.error.message);
	}

	const paths: { path: string; createdAt: string; updatedAt: string }[] = [];

	for (const file of files.data) {
		const currPath = [path, file.name].filter(isNotNullOrUndefined).join("/");
		if (file.id === null) {
			const sub = await walk(supabase, bucketName, currPath);

			paths.push(...sub);
		} else {
			paths.push({
				path: currPath,
				createdAt: file.created_at,
				updatedAt: file.updated_at,
			});
		}
	}

	return paths;
}

type TableNames = keyof typeof db.query;
type Schema = NonNullable<typeof db._.schema>;

type BucketLookupColumns = {
	[bucket in TableNames]?: {
		[column in keyof Schema[bucket]["columns"]]?: boolean;
	};
};

const bucketLookupColumns: BucketLookupColumns = {
	venues: { headerImageSource: true, thumbnailImageSource: true },
};

async function cleanupBucket(
	supabase: ReturnType<typeof getSupabaseServerClient>,
	bucketName: keyof Database["query"],
	objects: { path: string; createdAt: string; updatedAt: string }[],
) {
	const lookupColumns = bucketLookupColumns[bucketName];

	// TODO: dynamically search through tables with the same name as bucketName and check to see if values
	// of columns named in lookupColumns reference object paths in the objects list.

	const storagePaths = objects.map(({ path }) => path);

	const query = db.query[bucketName];

	const result = await query.findMany({
		columns: lookupColumns,
		where: (t, { or, inArray }) => {
			const filters = Object.keys(lookupColumns).map((key) =>
				inArray(t[key], storagePaths),
			);

			return or(...filters);
		},
	});

	const activePaths = new Set(result.flatMap((row) => Object.values(row)));

	const toDelete = objects.filter(({ path }) => !activePaths.has(path));

	console.log(
		Array.from(activePaths),
		toDelete,
		objects.length,
		"-",
		toDelete.length,
		"=",
		objects.length - toDelete.length,
	);
}

export const Route = createFileRoute("/api/tasks/cleanup/storage")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				// TODO:
				// - read all objects in each bucket
				// - check each location a file is stored to see if it is referenced
				// - if not, delete the objects

				const supabase = getSupabaseServerClient();

				const result = await supabase.storage.listBuckets();
				if (result.error) {
					throw internalServerError(result.error.message);
				}

				for (const bucket of result.data) {
					const paths = await walk(supabase, bucket.name);

					await cleanupBucket(supabase, bucket.name as TableNames, paths);
				}

				return new Response(JSON.stringify({ success: true }), {
					headers: {
						"Content-Type": "application/json",
					},
				});
			},
		},
	},
});

// ---------------------------------
