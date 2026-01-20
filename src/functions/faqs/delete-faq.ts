import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { faqs, selectFaqSchema } from "@/db/schema";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type z from "zod";

export const deleteFaqSchema = selectFaqSchema.pick({
	id: true,
});

export const deleteFaqFn = createServerFn()
	.inputValidator(deleteFaqSchema)
	.middleware([requirePermissions({ faqs: ["delete"] })])
	.handler(async ({ data: { id } }) => {
		await db.delete(faqs).where(eq(faqs.id, id));

		return {
			success: true,
		};
	});

export const deleteFaqMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof deleteFaqSchema>) =>
			deleteFaqFn({ data }),
	});
