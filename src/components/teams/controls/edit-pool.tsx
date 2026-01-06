import { useMutation, useQueryClient } from "@tanstack/react-query";
import { swapSeedsMutationOptions } from "@/functions/teams/swap-seeds";
import { teamsQueryOptions } from "@/data/teams";
import { useParams } from "@tanstack/react-router";
import { usePools } from "@/components/tournaments/context";
import { Select } from "@/components/base/select";
import { poolsQueryOptions } from "@/data/pools";
import { updatePoolMutationOptions } from "@/functions/teams/update-pool";

export type EditPoolFormProps = {
	tournamentDivisionTeamId: number;
	poolId: number;
	isUpDisabled: boolean;
	isDownDisabled: boolean;
};

export function EditPoolForm({
	tournamentDivisionTeamId,
	poolId,
}: EditPoolFormProps) {
	const { divisionId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		...updatePoolMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				teamsQueryOptions({
					tournamentDivisionId: Number.parseInt(divisionId, 10),
				}),
			);
		},
	});

	const pools = usePools();

	return (
		<Select
			value={poolId}
			options={pools.map(({ id, name }) => ({
				value: id,
				display: name.toUpperCase(),
			}))}
			onChange={(newPoolId) => {
				mutate({ id: tournamentDivisionTeamId, poolId: newPoolId as number });
			}}
		/>
	);
}
