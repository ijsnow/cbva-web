import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Popover } from "@/components/base/popover";
import { useTeamsQueryOptions } from "@/components/tournaments/context";
import { editSeedMutationOptions } from "@/functions/teams/edit-seed";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { EditIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Dialog } from "react-aria-components";

export type EditSeedFormProps = {
	tournamentDivisionTeamId: number;
	seed: number;
};

export function EditSeedForm({
	tournamentDivisionTeamId,
	seed,
}: EditSeedFormProps) {
	const [isOpen, setOpen] = useState(false);
	const triggerRef = useRef(null);

	const teamsQueryOptions = useTeamsQueryOptions();

	const { data: teams } = useSuspenseQuery(teamsQueryOptions);

	const lastSeed = Math.max(
		...(teams?.map(({ seed }) => seed ?? Number.POSITIVE_INFINITY) ?? []),
	);

	// const [showForm, setShowForm] = useState(false);
	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		...editSeedMutationOptions(),
		onSuccess: () => {
			setOpen(false);
			queryClient.invalidateQueries(teamsQueryOptions);
		},
	});

	const form = useAppForm({
		defaultValues: {
			seed,
		},
		validators: {
			// ...
		},
		onSubmit: ({ value: { seed } }) => {
			mutate({
				id: tournamentDivisionTeamId,
				seed,
			});
		},
	});

	return (
		<>
			<Button
				variant="icon"
				size="sm"
				ref={triggerRef}
				onPress={() => setOpen(true)}
			>
				<EditIcon />
			</Button>
			<Popover triggerRef={triggerRef} isOpen={isOpen} onOpenChange={setOpen}>
				<Dialog aria-label="Set team and waitlist capacity">
					<form
						className="p-3 flex flex-col"
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						{/* {failureReason && ( */}
						{/* 	<form.AppForm> */}
						{/* 		<form.Alert */}
						{/* 			title={"Unable to create pools"} */}
						{/* 			description={failureReason.message} */}
						{/* 		/> */}
						{/* 	</form.AppForm> */}
						{/* )} */}

						<form.AppField name="seed">
							{(field) => (
								<field.Number
									field={field}
									name="seed"
									label="Desired Seed"
									minValue={1}
									maxValue={lastSeed}
								/>
							)}
						</form.AppField>

						<form.AppForm>
							<form.Footer>
								<form.SubmitButton>Save</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</Dialog>
			</Popover>
		</>
	);

	// return (
	// 	<form
	// 		className="flex flex-row gap-1 flex-1 items-center w-full"
	// 		onSubmit={(event) => {
	// 			event.preventDefault();
	//
	// 			form.handleSubmit();
	// 		}}
	// 	>
	// 		<form.AppField name="seed">
	// 			{(field) => (
	// 				<field.Number field={field} name="seed" className="flex-1 min-w-0" />
	// 			)}
	// 		</form.AppField>
	// 		<form.AppForm>
	// 			<Button variant="icon" size="sm" onPress={() => setShowForm(false)}>
	// 				<XIcon size={16} />
	// 			</Button>
	// 			<form.SubmitButton variant="icon" size="sm">
	// 				<CheckIcon size={16} />
	// 			</form.SubmitButton>
	// 		</form.AppForm>
	// 	</form>
	// );
}
