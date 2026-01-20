import { createFileRoute } from "@tanstack/react-router";
import { requirePermissions, requireRole } from "@/auth/shared";
import { db } from "@/db/connection";
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

type TableNames = keyof typeof db._query;
type Schema = NonNullable<typeof db._.schema>;

type BucketLookupColumns = {
	[TTableName in TableNames]?: (keyof Schema[TTableName]["columns"])[];
};

const bucketLookupColumns = {
	venues: ["headerImageSource", "thumbnailImageSource"],
} as const satisfies BucketLookupColumns;

type ConfiguredBuckets = keyof typeof bucketLookupColumns;

async function cleanupBucket<TTableName extends ConfiguredBuckets>(
	supabase: ReturnType<typeof getSupabaseServerClient>,
	bucketName: TTableName,
	objects: { path: string; createdAt: string; updatedAt: string }[],
) {
	const lookupColumns = bucketLookupColumns[bucketName];

	// TODO: dynamically search through tables with the same name as bucketName and check to see if values
	// of columns named in lookupColumns reference object paths in the objects list.

	const storagePaths = objects.map(({ path }) => path);

	const query = db._query[bucketName];

	const result = await query.findMany({
		columns: lookupColumns.reduce((memo, key) => {
			memo[key] = true;
			return memo;
		}, {}),
		where: (t, { or, inArray }) => {
			const filters = lookupColumns.map((key) => inArray(t[key], storagePaths));

			return or(...filters);
		},
	});

	const activePaths = new Set(result.flatMap((row) => Object.values(row)));

	const objectsToDelete = objects.filter(({ path }) => !activePaths.has(path));

	const { error } = await supabase.storage
		.from(bucketName)
		.remove(objectsToDelete.map(({ path }) => path));

	if (error) {
		throw internalServerError(error.message);
	}

	return {
		success: true,
	};
}

export const Route = createFileRoute("/api/tasks/cleanup/storage")({
	server: {
		middleware: [requireRole(["admin"])],
		handlers: {
			POST: async () => {
				console.log("START /api/tasks/cleanup/storage");

				const supabase = getSupabaseServerClient();

				const result = await supabase.storage.listBuckets();
				if (result.error) {
					throw internalServerError(result.error.message);
				}

				for (const bucket of result.data) {
					if (!(bucket.name in bucketLookupColumns)) {
						continue;
					}

					const paths = await walk(supabase, bucket.name);

					await cleanupBucket(
						supabase,
						bucket.name as ConfiguredBuckets,
						paths,
					);
				}

				console.log("STOP /api/tasks/cleanup/storage");

				return new Response(JSON.stringify({ success: true }), {
					headers: {
						"Content-Type": "application/json",
					},
				});
			},
		},
	},
});
