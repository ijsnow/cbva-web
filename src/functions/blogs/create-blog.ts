import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { createBlogSchema, blogs } from "@/db/schema";
import type { LexicalState } from "@/db/schema/shared";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq, max, sql } from "drizzle-orm";
import type z from "zod";

export const createBlogFn = createServerFn()
	.inputValidator(createBlogSchema)
	.middleware([requirePermissions({ blogs: ["create"] })])
	.handler(async ({ data: { tag, imageSource, link, title, summary } }) => {
		const orderQ = db
			.select({ order: max(blogs.order) })
			.from(blogs)
			.where(eq(blogs.tag, tag));

		await db.insert(blogs).values({
			tag,
			imageSource,
			link,
			title,
			summary: summary as LexicalState,
			order: sql`COALESCE((${orderQ}), -1) + 1`,
		});

		return {
			success: true,
		};
	});

export const createBlogMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createBlogSchema>) =>
			createBlogFn({ data }),
	});
