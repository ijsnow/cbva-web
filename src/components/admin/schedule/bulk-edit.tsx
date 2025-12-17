import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CopyIcon, DeleteIcon, EditIcon, PlusIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { Pressable } from "react-aria-components";
import type z from "zod";
import { Button, button } from "@/components/base/button";
import { Link } from "@/components/base/link";
import { Pagination } from "@/components/base/pagination";
import { Toolbar } from "@/components/base/toolbar";
import { DeleteTournamentForm } from "@/components/tournaments/controls/delete";
import { DuplicateForm } from "@/components/tournaments/controls/duplicate";
import { EditGeneralInfoForm } from "@/components/tournaments/controls/edit-general-info";
import {
	TournamentListFilters,
	tournamentListFilterSchema,
} from "@/components/tournaments/filters";
import { DivisionsForm } from "@/components/tournaments/forms/divisions";
import {
	tournamentQueryOptions,
	tournamentsQueryOptions,
} from "@/data/tournaments";
import { getDefaultTimeZone } from "@/lib/dates";

export const bulkEditScheduleSearchSchema = tournamentListFilterSchema
	.omit({
		// past: true,
	})
	.extend({
		// past: z.boolean().default(false),
	});

export type BulkEditScheduleProps = {
	params: z.infer<typeof bulkEditScheduleSearchSchema>;
};

export function BulkEditSchedule(props: BulkEditScheduleProps) {
	const queryClient = useQueryClient();
	const queryProps = tournamentsQueryOptions(props.params);

	const { data: tournaments } = useSuspenseQuery(queryProps);

	const dateFormatter = useDateFormatter();

	const [editGeneralId, setEditGeneralId] = useState<number | undefined>();
	const [copyId, setCopyId] = useState<number | undefined>();
	const [deleteId, setDeleteId] = useState<number | undefined>();

	return (
		<div>
			<div className="py-8 bg-slate-300">
				<TournamentListFilters {...props.params} />
			</div>

			<div className="max-w-lg mx-auto pt-6 pb-2 flex flex-row justify-end">
				<Link
					to="/tournaments/create"
					className={button({
						variant: "solid",
						color: "alternate",
						class: "flex flex-row gap-2 items-center",
					})}
				>
					<PlusIcon size={16} /> <span>Create tournament</span>
				</Link>
			</div>
			<Suspense
				fallback={<div className="max-w-lg mx-auto pt-4 pb-12">Loading...</div>}
			>
				<div className="flex flex-col space-y-4 max-w-lg mx-auto pt-4 pb-12">
					{tournaments?.data.map(
						({ id, name, date, venue: { name: venueName, city } }) => {
							const parsedDate = parseDate(date);

							return (
								<div key={id} className="relative">
									<Toolbar
										orientation="vertical"
										className="absolute top-2 -right-2 translate-x-full flex flex-col space-y"
									>
										<Button
											variant="icon"
											onPress={() => {
												setCopyId(id);
											}}
										>
											<CopyIcon />
										</Button>
										<Button
											className="text-red-500"
											variant="icon"
											onPress={() => {
												setDeleteId(id);
											}}
										>
											<DeleteIcon />
										</Button>
									</Toolbar>
									<div className="rounded-lg bg-white overflow-hidden">
										<Pressable
											onPress={() => {
												setEditGeneralId(id);
											}}
										>
											<div className="p-2 bg-navbar-background text-navbar-foreground cursor-pointer hover:underline">
												{name && (
													<div className="flex flex-row space-x-2 items-center">
														<EditIcon size={18} /> <span>{name}</span>
													</div>
												)}
												<div className="flex flex-row justify-between font-semibold">
													<div className="flex flex-row items-center space-x-2">
														{!name && <EditIcon size={18} />}
														<span>
															{venueName}, {city}
														</span>
													</div>
													<div>
														{dateFormatter.format(
															parsedDate.toDate(getDefaultTimeZone()),
														)}
													</div>
												</div>
											</div>
										</Pressable>
										<div className="rounded p-2 bg-white flex flex-col">
											<DivisionsForm tournamentId={id} />
										</div>
									</div>
									{editGeneralId === id && (
										<EditGeneralInfoForm
											tournamentId={id}
											isOpen={editGeneralId === id}
											onOpenChange={() => setEditGeneralId(undefined)}
											onSuccess={() => {
												queryClient.invalidateQueries(queryProps);
												queryClient.invalidateQueries(
													tournamentQueryOptions(id),
												);
											}}
										/>
									)}
									{deleteId === id && (
										<DeleteTournamentForm
											tournamentId={id}
											isOpen={deleteId === id}
											onOpenChange={() => setDeleteId(undefined)}
											onSuccess={() => {
												queryClient.invalidateQueries(queryProps);
											}}
										/>
									)}

									{copyId === id && (
										<DuplicateForm
											tournamentId={id}
											isOpen={copyId === id}
											onOpenChange={() => setCopyId(undefined)}
											onSuccess={() => {
												queryClient.invalidateQueries(queryProps);
											}}
										/>
									)}
								</div>
							);
						},
					)}
					<Pagination
						to="/admin/schedule"
						page={props.params.page}
						pageSize={props.params.pageSize}
						pageInfo={tournaments.pageInfo}
					/>
				</div>
			</Suspense>
		</div>
	);
}
