import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { getPoolsQueryOptions } from "@/functions/pools/get-pools";
import { teamsQueryOptions } from "@/functions/teams/get-teams";
import {
	createPoolsMutationOptions,
	createPoolsSchema,
} from "@/functions/pools";
import type { Division, TournamentDivision } from "@/db/schema";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { useActiveTeamsFromUrl } from "../context";

export type CreatePoolsFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreatePoolsForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: CreatePoolsFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...createPoolsMutationOptions(),
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

	const schema = createPoolsSchema.pick({
		count: true,
		overwrite: true,
	});

	const form = useAppForm({
		defaultValues: {
			count: 1,
			overwrite: false,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { count, overwrite } }) => {
			mutate({
				id: division.id,
				count,
				overwrite,
			});
		},
	});

	const teams = useActiveTeamsFromUrl();

	const teamCount = teams?.length ?? "loading...";

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Create Pools
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Create pools for the{" "}
					<span className="font-bold italic">
						{getTournamentDivisionDisplay(division)}
					</span>{" "}
					division. If you want to recreate pools entirely, select{" "}
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
						name="count"
						children={(field) => (
							<field.Number label="Pool Count" field={field} minValue={1} />
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
