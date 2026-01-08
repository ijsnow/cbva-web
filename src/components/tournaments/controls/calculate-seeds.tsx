import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { teamsQueryOptions } from "@/data/teams";
import {
	calculateSeedsMutationOptions,
	calculateSeedsSchema,
} from "@/functions/teams/calculate-seeds";
import type { Division, TournamentDivision } from "@/db/schema";

export type CalculateSeedsFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CalculateSeedsForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: CalculateSeedsFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...calculateSeedsMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: teamsQueryOptions({ tournamentDivisionId: division.id })
					.queryKey,
			});

			onOpenChange(false);
		},
	});

	const schema = calculateSeedsSchema.pick({
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
				id: tournamentId,
				overwrite,
			});
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Calculate Seeds
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Calculate seeds for each division in this tournament. If you want to
					reset the seeds entirely, select{" "}
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
								title={"Unable to set seeds"}
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

							<form.SubmitButton requireChange={false}>
								Calculate
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
