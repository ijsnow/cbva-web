import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { poolsQueryOptions } from "@/data/pools";
import { teamsQueryOptions } from "@/data/teams";
import {
	simulateMatchesMutationOptions,
	simulateMatchesSchema,
} from "@/data/tournaments/matches";
import type { Division, TournamentDivision } from "@/db/schema";

export type SimulateMatchesFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function SimulateMatchesForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: SimulateMatchesFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...simulateMatchesMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: teamsQueryOptions({ tournamentDivisionId: division.id })
					.queryKey,
			});

			queryClient.invalidateQueries({
				queryKey: poolsQueryOptions({ tournamentDivisionId: division.id })
					.queryKey,
			});

			onOpenChange(false);
		},
	});

	const schema = simulateMatchesSchema.pick({});

	const form = useAppForm({
		defaultValues: {},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: () => {
			mutate({
				tournamentId,
			});
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Simulate Matches
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Simulate all pending games by randomly setting scores to valid
					completed scores.
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
								title={"Unable to simulate matches"}
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton requireChange={false}>
								Submit
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
