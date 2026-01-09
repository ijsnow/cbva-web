import { createMiddleware } from "@tanstack/react-start";
import { and } from "drizzle-orm";
import { authMiddleware, requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { playerProfiles } from "@/db/schema/player-profiles";

/**
 * Middleware that finds the director entry for the current viewer (if it exists)
 * and adds it to the context.
 *
 * This middleware depends on authMiddleware and should be used after it in the
 * middleware chain.
 *
 * @example
 * ```typescript
 * export const myServerFn = createServerFn()
 *   .middleware([withDirector])
 *   .handler(async ({ context }) => {
 *     // context.director is available here (or undefined if viewer is not a director)
 *     if (context.director) {
 *       console.log("Director ID:", context.director.id);
 *     }
 *   });
 * ```
 */
export const withDirectorId = createMiddleware()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.server(async ({ next, context }) => {
		const { viewer } = context;

		// Look up director record by viewer's user ID
		const director = await db.query.directors.findFirst({
			columns: {
				id: true,
			},
			where: (table, { eq, exists }) =>
				exists(
					db
						.select()
						.from(playerProfiles)
						.where(
							and(
								eq(playerProfiles.id, table.profileId),
								eq(playerProfiles.userId, viewer.id),
							),
						),
				),
		});

		return await next({
			context: {
				...context,
				directorId: director?.id ?? undefined,
			},
		});
	});
