import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { getPoolsQueryOptions } from "@/functions/pools/get-pools";
import { teamsQueryOptions } from "@/functions/teams/get-teams";
import { fillTournamentMutationOptions } from "@/data/tournaments/teams";
import type { Division, TournamentDivision } from "@/db/schema";

export type FillTournamentFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function FillTournamentForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: FillTournamentFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...fillTournamentMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: teamsQueryOptions({ tournamentDivisionId: division.id })
					.queryKey,
			});

			queryClient.invalidateQueries({
				queryKey: getPoolsQueryOptions({ tournamentDivisionId: division.id })
					.queryKey,
			});

			onOpenChange(false);
		},
	});

	const form = useAppForm({
		validators: {
			// onMount: schema,
			// onChange: schema,
		},
		onSubmit: () => {
			mutate({
				id: tournamentId,
			});
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Fill Tournament
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Randomly fill each division in the tournament to max capacity.
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
								title="Unable to fill tournament"
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
