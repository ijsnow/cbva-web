import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import clsx from "clsx";
import { EditIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Disclosure, DisclosurePanel, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal, ModalHeading } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { divisionsQueryOptions } from "@/data/divisions";
import { tournamentQueryOptions } from "@/data/tournaments";
import {
	removeTournamentDivisionMutationOptions,
	removeTournamentDivisionSchema,
} from "@/data/tournaments/divisions";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
// import { teamsQueryOptions } from "@/data/teams";
// import {
// 	editDivisionsMutationOptions,
// 	editDivisionsSchema,
// } from "@/data/tournaments/teams";
import { isNotNullOrUndefined } from "@/utils/types";
import { DivisionForm } from "./division-form";
import { RemoveDivisionForm } from "./remove";

export type EditDivisionsFormProps = {
	tournamentId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditDivisionsForm({
	tournamentId,
	onOpenChange,
	isOpen,
	...props
}: EditDivisionsFormProps) {
	const { data: divisionOptions } = useSuspenseQuery({
		...divisionsQueryOptions(),
		select: (divisions) =>
			divisions.map(({ id, name, maxAge }) => ({
				value: id,
				display: name.toUpperCase(),
				hasMaxAge: isNotNullOrUndefined(maxAge),
			})),
	});

	const { data: tournamentDivisions } = useSuspenseQuery({
		...tournamentQueryOptions(tournamentId),
		select: (data) => data?.tournamentDivisions,
	});

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...removeTournamentDivisionMutationOptions(),
		onSuccess: () => {
			// queryClient.invalidateQueries({
			// 	queryKey: teamsQueryOptions({ tournamentDivisionId: division.id })
			// 		.queryKey,
			// });

			onOpenChange(false);
		},
	});

	const [addingOrEditId, setAddingOrEditId] = useState<
		true | number | undefined
	>();

	useEffect(() => {
		if (!isOpen) {
			setAddingOrEditId(undefined);
		}
	}, [isOpen]);

	return (
		<Modal {...props} isOpen={isOpen} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<ModalHeading size="sm">Edit Divisions</ModalHeading>

				<div className="flex flex-col">
					<h3 className={title({ size: "xs" })}>Existing Divisions</h3>

					{tournamentDivisions?.map((td) => (
						<div
							key={td.id}
							className="flex flex-col space-y-2 last-of-type:border-b-0 border-b border-gray-300 py-2"
						>
							<div className="w-full flex flex-row justify-between items-center">
								<span
									className={clsx(td.id === addingOrEditId && "font-semibold")}
								>
									{getTournamentDivisionDisplay(td)}
								</span>

								<div className="flex flex-row gap-2">
									<Button
										size="sm"
										isDisabled={addingOrEditId !== undefined}
										onPress={() => {
											setAddingOrEditId(td.id);
										}}
									>
										<EditIcon size={12} className="-mr" /> <span>Edit</span>
									</Button>

									<RemoveDivisionForm
										isDisabled={addingOrEditId !== undefined}
										tournamentId={tournamentId}
										divisionId={td.id}
									/>
								</div>
							</div>

							{addingOrEditId === td.id && (
								<DivisionForm
									showTitle={false}
									tournamentId={tournamentId}
									divisionId={addingOrEditId}
									onCancel={() => setAddingOrEditId(undefined)}
								/>
							)}
						</div>
					))}
				</div>

				{addingOrEditId !== true && (
					<Button
						onPress={() => setAddingOrEditId(true)}
						isDisabled={addingOrEditId !== undefined}
					>
						<PlusIcon size={12} /> Add Another
					</Button>
				)}

				{addingOrEditId === true && (
					<DivisionForm
						tournamentId={tournamentId}
						divisionId={addingOrEditId === true ? undefined : addingOrEditId}
						onCancel={() => setAddingOrEditId(undefined)}
					/>
				)}
			</div>
		</Modal>
	);
}
