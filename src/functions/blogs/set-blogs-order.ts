import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { blogs } from "@/db/schema";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const setBlogsOrderSchema = z.object({
	tag: z.string(),
	order: z.array(z.number()),
});

export const setBlogsOrderFn = createServerFn()
	.inputValidator(setBlogsOrderSchema)
	.middleware([requirePermissions({ blogs: ["update"] })])
	.handler(async ({ data: { tag, order } }) => {
		await db.transaction((txn) =>
			Promise.all(
				order.map((id, i) =>
					txn
						.update(blogs)
						.set({ order: i })
						.where(and(eq(blogs.id, id), eq(blogs.tag, tag))),
				),
			),
		);

		return {
			success: true,
		};
	});

export const setBlogsOrderMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof setBlogsOrderSchema>) =>
			setBlogsOrderFn({ data }),
	});
