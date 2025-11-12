import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import z from "zod";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { TeamNames } from "@/components/teams/names";
import { poolMatchQueryOptions } from "@/data/matches";
import { overrideScoreMutationOptions } from "@/data/tournaments/matches";
// import {
// 	overrideScoreMutationOptions,
// 	overrideScoreSchema,
// } from "@/data/tournaments/teams";
import {
	type Division,
	selectMatchSetSchema,
	type TournamentDivision,
} from "@/db/schema";

export type OverrideScoreFormProps = {
	matchId: number;
	setId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function OverrideScoreForm({
	matchId,
	setId,
	onOpenChange,
	...props
}: OverrideScoreFormProps) {
	const { data: match } = useSuspenseQuery({
		...poolMatchQueryOptions(matchId),
	});

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...overrideScoreMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: poolMatchQueryOptions(matchId).queryKey,
			});

			onOpenChange(false);
		},
	});

	const set = match?.sets.find((s) => s.id === setId);

	console.log(set);

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
			teamAScore: set?.teamAScore as number,
			teamBScore: set?.teamBScore as number,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { teamAScore, teamBScore } }) => {
			if (set) {
				console.log({
					id: set.id,
					teamAScore,
					teamBScore,
				});
				mutate({
					id: set.id,
					teamAScore,
					teamBScore,
				});
			}
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<h3 className={title({ size: "sm" })}>Override Score</h3>

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
								label={<TeamNames players={match?.teamA?.team.players || []} />}
								field={field}
							/>
						)}
					/>

					<form.AppField
						name="teamBScore"
						children={(field) => (
							<field.Number
								label={<TeamNames players={match?.teamB?.team.players || []} />}
								field={field}
							/>
						)}
					/>

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
