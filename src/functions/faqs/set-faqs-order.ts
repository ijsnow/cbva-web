import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { faqs } from "@/db/schema";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, isNull } from "drizzle-orm";
import z from "zod";

export const setFaqsOrderSchema = z.object({
	key: z.string().nullable().optional(),
	order: z.array(z.number()),
});

export const setFaqsOrderFn = createServerFn()
	.inputValidator(setFaqsOrderSchema)
	.middleware([requirePermissions({ faqs: ["update"] })])
	.handler(async ({ data: { key, order } }) => {
		await db.transaction((txn) =>
			Promise.all(
				order.map((id, i) =>
					txn
						.update(faqs)
						.set({ order: i })
						.where(
							and(eq(faqs.id, id), key ? eq(faqs.key, key) : isNull(faqs.key)),
						),
				),
			),
		);

		return {
			success: true,
		};
	});

export const setFaqsOrderMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof setFaqsOrderSchema>) =>
			setFaqsOrderFn({ data }),
	});
