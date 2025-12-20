import { createServerFn } from "@tanstack/react-start";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import {
	authMiddleware,
	requireAuthenticated,
	roleHasPermission,
} from "@/auth/shared";
import { rateLimitMiddleware } from "@/lib/rate-limits";
import { forbidden, internalServerError } from "@/lib/responses";
import { getSupabaseServerClient } from "@/supabase/server";

export const bucketSchema = z.enum(["users", "venues"]);
export type BucketName = z.infer<typeof bucketSchema>;

export const getSignedUploadTokenFn = createServerFn()
	.middleware([
		authMiddleware,
		requireAuthenticated,
		// Limit example: allow 10 signed upload URLs per minute, with burst up to 5 at once.
		rateLimitMiddleware({
			keyPrefix: "storage-upload",
			points: 10,
			duration: 60,
			// blockDuration: 60 * 60 * 24,
		}),
	])
	.inputValidator(
		z.object({
			bucket: bucketSchema,
			prefix: z.string(),
			filename: z.string(),
		}),
	)
	.handler(
		async ({ context: { viewer }, data: { bucket, prefix, filename } }) => {
			const hasPermission = viewer
				? roleHasPermission(viewer?.role, {
						[bucket]: ["update"],
					})
				: false;

			if (!hasPermission) {
				throw forbidden();
			}

			const supabase = getSupabaseServerClient();

			try {
				const timestamp = Date.now();
				const uniqueId = uuidv4();
				const extension = filename.split(".").pop();
				const fileName = `${uniqueId}-${timestamp}.${extension}`;
				const storagePath = `${prefix}/${fileName}`;

				const { data, error } = await supabase.storage
					.from(bucket)
					.createSignedUploadUrl(storagePath);

				if (error) {
					throw internalServerError(error.message);
				}

				return { token: data.token, storagePath };
			} catch (error) {
				throw internalServerError((error as Error).message);
			}
		},
	);

// export const deleteObject = createServerFn()
// 	.middleware([
// 		requireAuthenticated,
// 		// Limit example: allow 10 signed upload URLs per minute, with burst up to 5 at once.
// 		rateLimitMiddleware({
// 			keyPrefix: "storage-upload",
// 			points: 10,
// 			duration: 60,
// 			// blockDuration: 60 * 60 * 24,
// 		}),
// 	])
// 	.inputValidator(
// 		z.object({ bucket: z.string(), prefix: z.string(), filename: z.string() }),
// 	)
