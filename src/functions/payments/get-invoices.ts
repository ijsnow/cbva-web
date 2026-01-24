import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";
import { isDefined } from "@/utils/types";
import z from "zod";
import { findPaged, pagingOptionsSchema } from "@/db/pagination";
import { requirePermissions } from "@/auth/shared";

export const getInvoicesSchema = z.object({
	pageInfo: pagingOptionsSchema,
});

export const getInvoices = createServerFn({
	method: "GET",
})
	.middleware([
		requirePermissions({
			invoices: ["read"],
		}),
	])
	.inputValidator(getInvoicesSchema)
	.handler(async ({ data: { pageInfo } }) => {
		return findPaged(db, "invoices", {
			paging: pageInfo,
			countColumn: "id",
			query: {
				with: {
					purchaser: true,
					memberships: {
						with: {
							profile: true,
						},
					},
					tournamentRegistrations: true,
				},
			},
		});
	});

export const getInvoicesQueryOptions = (
	data: z.infer<typeof getInvoicesSchema>,
) =>
	queryOptions({
		queryKey: ["getInvoices", JSON.stringify(data)].filter(isDefined),
		queryFn: () => getInvoices({ data }),
	});
