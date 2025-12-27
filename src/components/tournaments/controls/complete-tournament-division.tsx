import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { poolsQueryOptions } from "@/data/pools";
import { teamsQueryOptions } from "@/data/teams";
import {
	completeTournamentDivisionMutationOptions,
	completeTournamentDivisionSchema,
} from "@/data/tournaments/complete";
import type { Division, TournamentDivision } from "@/db/schema";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";

export type CompleteTournamentDivisionFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CompleteTournamentDivisionForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: CompleteTournamentDivisionFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...completeTournamentDivisionMutationOptions(),
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

	// const schema = completeTournamentDivisionSchema;

	const form = useAppForm({
		defaultValues: {
			// overwrite: false,
		},
		validators: {
			// onMount: schema,
			// onChange: schema,
		},
		onSubmit: () => {
			mutate({
				id: division.id,
			});
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Complete Division
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Mark the{" "}
					<span className="font-bold italic">
						{getTournamentDivisionDisplay(division)}
					</span>{" "}
					division as complete.
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
								title="Unable to complete division."
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
