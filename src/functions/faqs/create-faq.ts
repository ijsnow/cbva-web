import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { createFaqSchema, faqs } from "@/db/schema";
import type { LexicalState } from "@/db/schema/shared";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import type z from "zod";

export const createFaqFn = createServerFn()
	.inputValidator(createFaqSchema)
	.middleware([requirePermissions({ faqs: ["create"] })])
	.handler(async ({ data: { question, answer } }) => {
		await db.insert(faqs).values({
			question,
			answer: answer as LexicalState,
			order: sql`COALESCE((SELECT MAX(${faqs.order}) FROM ${faqs}), -1) + 1`,
		});

		return {
			success: true,
		};
	});

export const createFaqMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createFaqSchema>) =>
			createFaqFn({ data }),
	});
