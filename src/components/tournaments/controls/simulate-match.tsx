import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gamepad2Icon } from "lucide-react";
import { useState } from "react";
import { Heading } from "react-aria-components";
import type z from "zod";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { TeamNames } from "@/components/teams/names";
import { playoffsQueryOptions } from "@/functions/playoffs/get-playoffs";
import { teamsQueryOptions } from "@/functions/teams/get-teams";
import {
	simulateMatchMutationOptions,
	simulateMatchSchema,
} from "@/functions/matches";
import { type MatchIdProps, useMatchTeams } from "@/lib/matches";
import type { MatchTeam } from "../panels/games/pool-match-grid";
import { usePoolsQueryOptions } from "../context";

export type SimulateMatchModalProps = MatchIdProps & {
	tournamentDivisionId: number;
	opponent?: MatchTeam | null;
};

export function SimulateMatchModal({
	tournamentDivisionId,
	poolMatchId,
	playoffMatchId,
	opponent,
	...props
}: SimulateMatchModalProps) {
	const teams = useMatchTeams({ poolMatchId, playoffMatchId });

	const queryClient = useQueryClient();

	const [isOpen, setOpen] = useState(false);

	const poolsQueryOptions = usePoolsQueryOptions();

	const { mutate, failureReason } = useMutation({
		...simulateMatchMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				teamsQueryOptions({ tournamentDivisionId }),
			);

			if (playoffMatchId) {
				queryClient.invalidateQueries(
					playoffsQueryOptions({ tournamentDivisionId }),
				);
			} else {
				queryClient.invalidateQueries(poolsQueryOptions);
			}

			setOpen(false);
		},
	});

	const schema = simulateMatchSchema;

	const form = useAppForm({
		defaultValues: {
			poolMatchId,
			playoffMatchId,
		} as z.infer<typeof simulateMatchSchema>,
		validators: {
			onMount: schema,
		},
		onSubmit: () => {
			mutate({
				poolMatchId,
				playoffMatchId,
			});
		},
	});

	return (
		<>
			<Button
				size="xs"
				variant="text"
				className="text-green-500 hover:text-green-600 self-end"
				onPress={() => {
					setOpen(true);
				}}
				tooltip="Simulate match"
			>
				<Gamepad2Icon size={16} />
			</Button>

			<Modal {...props} isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-4 relative">
					<Heading className={title({ size: "sm" })} slot="title">
						Simulate Match
					</Heading>

					{teams?.teamA && teams?.teamB && (
						<p>
							Are you sure you want to simulate match between{" "}
							<TeamNames
								className="font-semibold italic"
								players={teams?.teamA?.team.players}
								link={false}
							/>{" "}
							and{" "}
							<TeamNames
								className="font-semibold italic"
								players={teams?.teamB?.team.players}
								link={false}
							/>
							?
						</p>
					)}

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
									title={"Unable to simulate match."}
									description={failureReason.message}
								/>
							</form.AppForm>
						)}

						<form.AppForm>
							<form.Footer>
								<Button onPress={() => setOpen(false)}>Cancel</Button>

								<form.SubmitButton requireChange={false}>
									Confirm
								</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</>
	);
}
