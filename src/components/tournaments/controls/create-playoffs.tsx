import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { playoffsQueryOptions } from "@/data/playoffs";
import { teamsQueryOptions } from "@/data/teams";
import {
	createPlayoffsMutationOptions,
	createPlayoffsSchema,
	type MatchKind,
} from "@/data/tournaments/playoffs";
import type { Division, TournamentDivision } from "@/db/schema";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";

export type CreatePlayoffsFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreatePlayoffsForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: CreatePlayoffsFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...createPlayoffsMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				playoffsQueryOptions({ tournamentDivisionId: division.id }),
			);

			onOpenChange(false);
		},
	});

	const schema = createPlayoffsSchema.pick({
		teamCount: true,
		wildcardCount: true,
		matchKind: true,
		overwrite: true,
	});

	const form = useAppForm({
		defaultValues: {
			teamCount: 10,
			wildcardCount: 2,
			matchKind: "set-to-28" as MatchKind,
			overwrite: false,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({
			value: { teamCount, wildcardCount, matchKind, overwrite },
		}) => {
			mutate({
				id: division.id,
				teamCount,
				wildcardCount,
				matchKind,
				overwrite,
			});
		},
	});

	const { data: teamCount } = useQuery({
		...teamsQueryOptions({ tournamentDivisionId: division.id }),
		select: (data) => data.length,
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Create Playoffs
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Create the playoff bracket for the{" "}
					<span className="font-bold italic">
						{getTournamentDivisionDisplay(division)}
					</span>{" "}
					division. If you want to recreate the bracket entirely, select{" "}
					<span className="font-semibold italic">Overwrite existing</span>.
				</p>

				{teamCount && (
					<p className="text-sm text-gray-700 mb-6">
						There are <span className="font-bold italic">{teamCount}</span>{" "}
						teams in this division.
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
								title={"Unable to create pools"}
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppField
						name="teamCount"
						children={(field) => (
							<field.Number label="Team Count" field={field} minValue={1} />
						)}
					/>

					<form.AppField
						name="wildcardCount"
						children={(field) => (
							<field.Number label="Wildcard Count" field={field} minValue={0} />
						)}
					/>

					<form.AppField
						name="matchKind"
						children={(field) => (
							<field.Select
								label="Match Style"
								field={field}
								options={[
									{
										display: "Game to 28",
										value: "set-to-28",
									},
									{
										display: "Best of 3",
										value: "best-of-3",
									},
									{
										display: "Game to 21",
										value: "set-to-21",
									},
								]}
							/>
						)}
					/>

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
								Create
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
