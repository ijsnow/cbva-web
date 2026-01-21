import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { blogs, selectBlogSchema } from "@/db/schema";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type z from "zod";

export const deleteBlogSchema = selectBlogSchema.pick({
	id: true,
});

export const deleteBlogFn = createServerFn()
	.inputValidator(deleteBlogSchema)
	.middleware([requirePermissions({ blogs: ["delete"] })])
	.handler(async ({ data: { id } }) => {
		await db.delete(blogs).where(eq(blogs.id, id));

		return {
			success: true,
		};
	});

export const deleteBlogMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof deleteBlogSchema>) =>
			deleteBlogFn({ data }),
	});
