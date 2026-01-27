import z from "zod";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getInvoicesQueryOptions } from "@/functions/payments/get-invoices";
import { title } from "@/components/base/primitives";
import { AdminLayout } from "@/layouts/admin";
import {
	Disclosure,
	DisclosureGroup,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";
import { Pagination } from "@/components/base/pagination";
import { useDateFormatter } from "@react-aria/i18n";
import { parseDate } from "@internationalized/date";
import { getDefaultTimeZone } from "@/lib/dates";
import { ProfileName } from "@/components/profiles/name";
import { TeamNames } from "@/components/teams/names";
import {
	getTournamentDisplay,
	getTournamentDivisionDisplay,
} from "@/hooks/tournament";

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

	const { data: { data: invoices, pageInfo } = {} } = useSuspenseQuery(
		getInvoicesQueryOptions({
			pageInfo: {
				page,
				size: pageSize,
			},
		}),
	);

	const dateFormatter = useDateFormatter({
		dateStyle: "short",
	});

	return (
		<AdminLayout
			classNames={{
				content: "flex flex-col space-y-8 max-w-2xl px-3 py-12 mx-auto",
			}}
		>
			<section className="flex flex-col space-y-4">
				<h2
					className={title({
						size: "sm",
						class: "flex flex-row justify-between items-center",
					})}
				>
					<span>Invoices</span>
					<span className="text-sm font-normal text-gray-500">
						{pageInfo?.totalItems} total
					</span>
				</h2>

				{invoices?.length === 0 ? (
					<p className="text-gray-500">No invoices found.</p>
				) : (
					<DisclosureGroup className="bg-white">
						{invoices?.map((invoice) => (
							<Disclosure key={invoice.id}>
								<DisclosureHeader
									size="sm"
									contentClassName="flex-1 flex flex-row justify-between items-center gap-4"
								>
									<span className="text-xs text-gray-500">
										#{invoice.id}
										{invoice.createdAt && (
											<>- {dateFormatter.format(invoice.createdAt)}</>
										)}
									</span>
									<span className="flex-1 truncate">
										{invoice.purchaser.name || invoice.purchaser.email}
									</span>
									<span className="text-sm text-gray-600">
										{invoice.memberships.length > 0 && (
											<span>{invoice.memberships.length} membership(s)</span>
										)}
										{invoice.memberships.length > 0 &&
											invoice.tournamentRegistrations.length > 0 &&
											", "}
										{invoice.tournamentRegistrations.length > 0 && (
											<span>
												{invoice.tournamentRegistrations.length} registration(s)
											</span>
										)}
										{(invoice.memberships.length > 0 ||
											invoice.tournamentRegistrations.length > 0) &&
											invoice.teamRegistrations.length > 0 &&
											", "}
										{invoice.teamRegistrations.length > 0 && (
											<span>
												{invoice.teamRegistrations.length} team registration(s)
											</span>
										)}
									</span>
								</DisclosureHeader>
								<DisclosurePanel>
									<div className="space-y-3 text-sm">
										<div className="flex flex-col gap-1">
											<span className="text-xs font-medium text-gray-500">
												Transaction Key
											</span>
											<span className="text-xs">{invoice.transactionKey}</span>
										</div>

										{invoice.memberships.length > 0 && (
											<div className="flex flex-col gap-1">
												<span className="text-xs font-medium text-gray-500">
													Memberships
												</span>
												<ul className="space-y-1">
													{invoice.memberships.map((membership) => (
														<li
															key={membership.id}
															className="flex justify-between"
														>
															<ProfileName {...membership.profile} />
															<span className="text-gray-500">
																Valid until{" "}
																{dateFormatter.format(
																	parseDate(membership.validUntil).toDate(
																		getDefaultTimeZone(),
																	),
																)}
															</span>
														</li>
													))}
												</ul>
											</div>
										)}

										{invoice.tournamentRegistrations.length > 0 && (
											<div className="flex flex-col gap-1">
												<span className="text-xs font-medium text-gray-500">
													Tournament Registrations
												</span>
												<ul className="space-y-1">
													{invoice.tournamentRegistrations.map(
														(registration) => (
															<li key={registration.id}>
																Team #{registration.tournamentDivisionTeamId}
															</li>
														),
													)}
												</ul>
											</div>
										)}
										{invoice.teamRegistrations.length > 0 && (
											<div className="flex flex-col gap-1">
												<span className="text-xs font-medium text-gray-500">
													Team Registrations
												</span>
												<ul className="space-y-1">
													{invoice.teamRegistrations.map((teamReg) => (
														<li
															key={teamReg.id}
															className="flex flex-col gap-y"
														>
															<span>
																{getTournamentDisplay(
																	teamReg.tournamentDivision.tournament,
																)}{" "}
																{getTournamentDivisionDisplay(
																	teamReg.tournamentDivision,
																)}
															</span>
															<span className="text-xs text-gray-600">
																<TeamNames players={teamReg.team.players} />
															</span>
														</li>
													))}
												</ul>
											</div>
										)}
									</div>
								</DisclosurePanel>
							</Disclosure>
						))}
					</DisclosureGroup>
				)}

				{pageInfo && pageInfo.totalPages > 1 && (
					<Pagination
						to="/admin/invoices"
						page={page}
						pageSize={pageSize}
						pageInfo={pageInfo}
					/>
				)}
			</section>
		</AdminLayout>
	);
}
