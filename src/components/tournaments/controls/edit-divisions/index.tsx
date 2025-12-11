import { useSuspenseQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { EditIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/base/button";
import { Modal, ModalHeading } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { tournamentQueryOptions } from "@/data/tournaments";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
// import { teamsQueryOptions } from "@/data/teams";
// import {
// 	editDivisionsMutationOptions,
// 	editDivisionsSchema,
// } from "@/data/tournaments/teams";
import { DivisionForm } from "./division-form";
import { RemoveDivisionForm } from "./remove";
// import { RequirementsForm } from "./requirements-form";

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
	const { data: tournamentDivisions } = useSuspenseQuery({
		...tournamentQueryOptions(tournamentId),
		select: (data) => data?.tournamentDivisions,
	});

	// const [editFormatDivisionId, setEditFormatDivisionId] = useState<
	// 	number | undefined
	// >();

	const [addingOrEditId, setAddingOrEditId] = useState<
		true | number | undefined
	>();

	useEffect(() => {
		if (!isOpen) {
			setAddingOrEditId(undefined);
			// setEditFormatDivisionId(undefined);
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
									{/*<Button
										size="sm"
										isDisabled={
											addingOrEditId !== undefined ||
											editFormatDivisionId !== undefined
										}
										onPress={() => {
											setEditFormatDivisionId(td.id);
										}}
									>
										<EditIcon size={12} className="-mr" /> <span>Format</span>
									</Button>*/}
									<Button
										size="sm"
										isDisabled={
											addingOrEditId !== undefined // || editFormatDivisionId !== undefined
										}
										onPress={() => {
											setAddingOrEditId(td.id);
										}}
									>
										<EditIcon size={12} className="-mr" /> <span>Edit</span>
									</Button>

									<RemoveDivisionForm
										isDisabled={
											addingOrEditId !== undefined // || editFormatDivisionId !== undefined
										}
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

							{/*{editFormatDivisionId === td.id && (
								<RequirementsForm
									tournamentId={tournamentId}
									tournamentDivisionId={editFormatDivisionId}
									divisionId={td.divisionId}
									name={td.name}
									displayGender={td.displayGender}
									displayDivision={td.displayDivision}
									teamSize={td.teamSize}
									onCancel={() => setEditFormatDivisionId(undefined)}
								/>
							)}*/}
						</div>
					))}
				</div>

				{addingOrEditId !== true && (
					<Button
						onPress={() => setAddingOrEditId(true)}
						isDisabled={addingOrEditId !== undefined}
					>
						<PlusIcon size={12} /> Add division
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
