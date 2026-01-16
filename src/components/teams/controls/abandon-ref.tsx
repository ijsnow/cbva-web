import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import {
	abandonRefMutationOptions,
	abandonRefSchema,
} from "@/functions/teams/abandon-ref";
import { FlagIcon } from "lucide-react";
import { useState } from "react";
import { teamsQueryOptions } from "@/functions/teams/get-teams";
import { getPoolsQueryOptions } from "@/functions/pools/get-pools";
import { playoffsQueryOptions } from "@/functions/playoffs/get-playoffs";

export type AbandonRefFormProps = {
	tournamentDivisionId: number;
	id?: number;
	teamId?: number;
};

export function AbandonRefForm({
	tournamentDivisionId,
	id,
	teamId,
	...props
}: AbandonRefFormProps) {
	const [open, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...abandonRefMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				teamsQueryOptions({ tournamentDivisionId }),
			);
			queryClient.invalidateQueries(
				getPoolsQueryOptions({ tournamentDivisionId }),
			);
			queryClient.invalidateQueries(
				playoffsQueryOptions({ tournamentDivisionId }),
			);

			setOpen(false);
		},
	});

	const schema = abandonRefSchema.omit({ id: true, teamId: true });

	const form = useAppForm({
		defaultValues: {},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: () => {
			mutate({
				id,
				teamId,
			});
		},
	});

	return (
		<>
			<Button
				variant="text"
				size="xs"
				color="primary"
				onPress={() => setOpen(true)}
				tooltip="Abandoned Ref"
			>
				<FlagIcon size={12} />
			</Button>
			<Modal {...props} isOpen={open} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-4 relative">
					<Heading className={title({ size: "sm" })} slot="title">
						Abandon Ref
					</Heading>

					<div>
						<p className="text-sm text-gray-700 mb-2">
							Are you sure you want to mark this team as having abandoned ref
							duties?
						</p>

						<p className="text-sm text-gray-700">
							You can undo this action from the team's table.
						</p>
					</div>

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
									title={"Unable to mark abandoned ref"}
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
