import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { teamsQueryOptions } from "@/data/teams";
import {
	createPoolMatchesMutationOptions,
	createPoolMatchesSchema,
} from "@/data/tournaments/pools";
import type { Division, TournamentDivision } from "@/db/schema";
import { poolsQueryOptions } from "@/data/pools";

export type CreatePoolMatchesFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreatePoolMatchesForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: CreatePoolMatchesFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...createPoolMatchesMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: teamsQueryOptions(division.id).queryKey,
			});

			queryClient.invalidateQueries({
				queryKey: poolsQueryOptions({ tournamentDivisionId: division.id })
					.queryKey,
			});

			onOpenChange(false);
		},
	});

	const schema = createPoolMatchesSchema.pick({
		overwrite: true,
	});

	const form = useAppForm({
		defaultValues: {
			overwrite: false,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { overwrite } }) => {
			mutate({
				id: division.id,
				overwrite,
			});
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<h3 className={title({ size: "sm" })}>Create Pool Matches</h3>

				<p className="text-sm text-gray-700 mb-6">
					Create matches for all pools in this tournament. If you want to recreate pools entirely, select{" "}
					<span className="font-semibold italic">Overwrite existing</span>.
				</p>

				<form
					className="flex flex-col space-y-6"
					onSubmit={(e) => {
						e.preventDefault();

						form.handleSubmit();
					}}
				>
					{failureReason && (
						<form.AppForm>
							<form.Alert
								title={"Unable to create pools"}
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppField
						name="overwrite"
						children={(field) => (
							<field.Checkbox label="Overwrite existing" field={field} />
						)}
					/>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton>Create</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
