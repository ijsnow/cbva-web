import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import z from "zod";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { TeamNames } from "@/components/teams/names";
import {
	playoffMatchQueryOptions,
	poolMatchQueryOptions,
} from "@/data/matches";
import { overrideScoreMutationOptions } from "@/functions/matches";
import { type MatchIdProps, useMatchSets, useMatchTeams } from "@/lib/matches";
import { playoffsQueryOptions } from "@/functions/playoffs/get-playoffs";
import { getMatchQueryOptions } from "@/functions/matches/get-match";
import { getPoolsQueryOptions } from "@/functions/pools/get-pools";

export type OverrideScoreFormProps = MatchIdProps & {
	tournamentDivisionId?: number;
	setId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function OverrideScoreForm({
	tournamentDivisionId,
	poolMatchId,
	playoffMatchId,
	setId,
	onOpenChange,
	...props
}: OverrideScoreFormProps) {
	const teams = useMatchTeams({ poolMatchId, playoffMatchId });
	const sets = useMatchSets({ poolMatchId, playoffMatchId });

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...overrideScoreMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				getMatchQueryOptions({ poolMatchId, playoffMatchId }),
			);

			console.log({
				poolMatchId,
				tournamentDivisionId,
			});

			if (poolMatchId && tournamentDivisionId) {
				queryClient.invalidateQueries(
					getPoolsQueryOptions({ tournamentDivisionId }),
				);
			} else if (playoffMatchId && tournamentDivisionId) {
				queryClient.invalidateQueries(
					playoffsQueryOptions({ tournamentDivisionId }),
				);
			}

			onOpenChange(false);
		},
	});

	const set = sets?.find((s) => s.id === setId);

	const schema = z
		.object({
			teamAScore: z.number(),
			teamBScore: z.number(),
		})
		.refine(
			({ teamAScore, teamBScore }) => {
				const winScore = set?.winScore ?? 21;

				// Check if scores are valid according to volleyball rules
				const maxScore = Math.max(teamAScore, teamBScore);
				const minScore = Math.min(teamAScore, teamBScore);

				if (maxScore > winScore && maxScore - minScore > 2) {
					return false;
				}

				return true;
			},
			{
				message: "Invalid score.",
				path: ["teamBScore"],
			},
		);

	const form = useAppForm({
		defaultValues: {
			teamAScore: set?.teamAScore ?? 0,
			teamBScore: set?.teamBScore ?? 0,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { teamAScore, teamBScore }, formApi }) => {
			if (set) {
				mutate(
					{
						id: set.id,
						teamAScore,
						teamBScore,
					},
					{
						onSuccess: () => {
							formApi.reset();
						},
					},
				);
			}
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Override Score
				</Heading>

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
						name="teamAScore"
						children={(field) => (
							<field.Number
								label={<TeamNames players={teams?.teamA?.team.players || []} />}
								field={field}
							/>
						)}
					/>

					<form.AppField
						name="teamBScore"
						children={(field) => (
							<field.Number
								label={<TeamNames players={teams?.teamB?.team.players || []} />}
								field={field}
							/>
						)}
					/>

					<form.AppForm>
						<form.StateDebugger />
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
