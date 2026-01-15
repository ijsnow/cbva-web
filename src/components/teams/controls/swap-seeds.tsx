import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/base/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { swapSeedsMutationOptions } from "@/functions/teams/swap-seeds";
import { teamsQueryOptions } from "@/functions/teams/get-teams";
import { useParams } from "@tanstack/react-router";

export type EditSeedFormProps = {
	tournamentDivisionTeamId: number;
	seed: number;
	isUpDisabled: boolean;
	isDownDisabled: boolean;
};

export function SwapSeedsForm({
	tournamentDivisionTeamId,
	seed,
	isUpDisabled,
	isDownDisabled,
}: EditSeedFormProps) {
	const { divisionId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		...swapSeedsMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				teamsQueryOptions({
					tournamentDivisionId: Number.parseInt(divisionId, 10),
				}),
			);
		},
	});

	return (
		<div className="flex flex-row gap-2">
			<Button
				variant="icon"
				size="sm"
				isDisabled={isUpDisabled}
				onPress={() => {
					mutate({
						id: tournamentDivisionTeamId,
						seed: seed - 1,
					});
				}}
			>
				<ArrowUpIcon size={16} />
			</Button>
			<Button
				variant="icon"
				size="sm"
				isDisabled={isDownDisabled}
				onPress={() => {
					mutate({
						id: tournamentDivisionTeamId,
						seed: seed + 1,
					});
				}}
			>
				<ArrowDownIcon size={16} />
			</Button>
		</div>
	);
}
