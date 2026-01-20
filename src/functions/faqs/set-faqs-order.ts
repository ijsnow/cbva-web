import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { faqs } from "@/db/schema";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

export const setFaqsOrderSchema = z.object({
	order: z.array(z.number()),
});

export const setFaqsOrderFn = createServerFn()
	.inputValidator(setFaqsOrderSchema)
	.middleware([requirePermissions({ faqs: ["update"] })])
	.handler(async ({ data: { order } }) => {
		await db.transaction((txn) =>
			Promise.all(
				order.map((id, i) =>
					txn.update(faqs).set({ order: i }).where(eq(faqs.id, id)),
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
