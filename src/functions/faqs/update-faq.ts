import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { faqs, selectFaqSchema } from "@/db/schema";
import { LexicalState } from "@/db/schema/shared";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type z from "zod";

export const updateFaqSchema = selectFaqSchema.pick({
	id: true,
	question: true,
	answer: true,
});

export const updateFaqFn = createServerFn()
	.inputValidator(updateFaqSchema)
	.middleware([requirePermissions({ faqs: ["update"] })])
	.handler(async ({ data: { id, question, answer } }) => {
		await db
			.update(faqs)
			.set({
				question,
				answer: answer as LexicalState,
			})
			.where(eq(faqs.id, id));

		return {
			success: true,
		};
	});

export const updateFaqMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof updateFaqSchema>) =>
			updateFaqFn({ data }),
	});
