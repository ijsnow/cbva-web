import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import {
	updateDivisionBatchMutationOptions,
	updateDivisionBatchSchema,
} from "@/functions/tournaments/update-division-batch";
import { tournamentQueryOptions } from "@/data/tournaments";
import {
	getTournamentDisplay,
	getTournamentDivisionDisplay,
} from "@/hooks/tournament";
import type z from "zod";
import { assert } from "@/utils/assert";

export type ManageDivisionsFormProps = {
	tournamentId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ManageDivisionsForm({
	tournamentId,
	onOpenChange,
	...props
}: ManageDivisionsFormProps) {
	const queryOptions = tournamentQueryOptions(tournamentId);

	const { data: tournament } = useQuery({
		...queryOptions,
		enabled: props.isOpen,
	});

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...updateDivisionBatchMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(queryOptions);

			onOpenChange(false);
		},
	});

	const schema = updateDivisionBatchSchema;

	const form = useAppForm({
		defaultValues: {
			divisions:
				tournament?.tournamentDivisions.map(
					({ id, capacity, waitlistCapacity }) => ({
						id,
						capacity,
						waitlistCapacity,
					}),
				) ?? [],
		} as z.infer<typeof schema>,
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { divisions }, formApi }) => {
			mutate(
				{
					divisions,
				},
				{
					onSuccess: () => {
						formApi.reset();
					},
				},
			);
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Manage Divisions
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Manage divisions for{" "}
					{tournament && (
						<span className="font-semibold italic">
							{getTournamentDisplay(tournament)}
						</span>
					)}
					.
				</p>

				<form
					className="flex flex-col space-y-2"
					onSubmit={(e) => {
						e.preventDefault();

						form.handleSubmit();
					}}
				>
					{failureReason && (
						<form.AppForm>
							<form.Alert
								title="Unable to fill tournament"
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<div className="grid grid-cols-6 gap-2">
						<span className="col-start-3 col-end-5">Capacity</span>
						<span className="col-span-2">WL Capacity</span>
					</div>

					<form.AppField name="divisions" mode="array">
						{(field) =>
							field.state.value?.map(({ id }, i) => {
								const division = tournament?.tournamentDivisions.find(
									(d) => d.id === id,
								);

								assert(division, "invalid division id");

								return (
									<div key={id} className="grid grid-cols-6 gap-2 items-center">
										<div className="col-span-2">
											{getTournamentDivisionDisplay(division)}
										</div>
										<form.AppField name={`divisions[${i}].capacity`}>
											{(subField) => (
												<subField.Number
													field={subField}
													className="col-span-2"
												/>
											)}
										</form.AppField>
										<form.AppField name={`divisions[${i}].waitlistCapacity`}>
											{(subField) => (
												<subField.Number
													field={subField}
													className="col-span-2"
												/>
											)}
										</form.AppField>
									</div>
								);
							})
						}
					</form.AppField>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton>Submit</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
