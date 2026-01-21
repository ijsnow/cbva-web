import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { blogs, selectBlogSchema } from "@/db/schema";
import { LexicalState } from "@/db/schema/shared";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type z from "zod";

export const updateBlogSchema = selectBlogSchema.pick({
	id: true,
	imageSource: true,
	link: true,
	title: true,
	summary: true,
});

export const updateBlogFn = createServerFn()
	.inputValidator(updateBlogSchema)
	.middleware([requirePermissions({ blogs: ["update"] })])
	.handler(async ({ data: { id, imageSource, link, title, summary } }) => {
		await db
			.update(blogs)
			.set({
				imageSource,
				link,
				title,
				summary: summary as LexicalState,
			})
			.where(eq(blogs.id, id));

		return {
			success: true,
		};
	});

export const updateBlogMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof updateBlogSchema>) =>
			updateBlogFn({ data }),
	});
