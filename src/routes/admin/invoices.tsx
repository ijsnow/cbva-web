import z from "zod";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getInvoicesQueryOptions } from "@/functions/payments/get-invoices";
import { title } from "@/components/base/primitives";
import { AdminLayout } from "@/layouts/admin";

const searchSchema = z.object({
	page: z.number().default(1),
	pageSize: z.number().default(25),
});

export const Route = createFileRoute("/admin/invoices")({
	validateSearch: searchSchema,
	loader: async ({ context: { queryClient, ...context } }) => {
		const viewer = context.viewer;

		if (!viewer || viewer.role !== "admin") {
			throw redirect({ to: "/not-found" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { page, pageSize } = Route.useSearch();

	const { data: invoices } = useSuspenseQuery(
		getInvoicesQueryOptions({
			pageInfo: {
				page,
				size: pageSize,
			},
		}),
	);

	return (
		<AdminLayout
			classNames={{
				content: "flex flex-col space-y-12 max-w-2xl px-3 py-12 mx-auto",
			}}
		>
			<section className="flex flex-col space-y-8">
				<h2
					className={title({
						size: "sm",
						class: "flex flex-row justify-between items-center",
					})}
				>
					<span>Invoices</span>
				</h2>
			</section>
		</AdminLayout>
	);
}
