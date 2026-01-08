import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import {
	removeTeamMutationOptions,
	removeTeamSchema,
} from "@/functions/teams/remove-team";
import { isDefined } from "@/utils/types";
import { useTeamsQueryOptions } from "@/components/tournaments/context";

export type RemoveTeamFormProps = {
	tournamentDivisionTeamId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function RemoveTeamForm({
	tournamentDivisionTeamId,
	...props
}: RemoveTeamFormProps) {
	const queryClient = useQueryClient();

	const teamQueryOptions = useTeamsQueryOptions();

	const { mutate, failureReason } = useMutation({
		...removeTeamMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(teamQueryOptions);

			props.onOpenChange(false);
		},
	});

	const schema = removeTeamSchema.omit({ id: true });

	const form = useAppForm({
		defaultValues: {},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: () => {
			mutate({
				id: tournamentDivisionTeamId,
			});
		},
	});

	return (
		<Modal {...props}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Undo Abandon Ref?
				</Heading>

				<p className="text-sm text-gray-700 mb-2">
					Are you sure you want to undo marking this team as having abandoned
					ref duties?
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
								title={"Unable to mark abandoned ref"}
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => setOpen(false)}>Cancel</Button>

							<form.SubmitButton
								requireChange={false}
								isDisabled={!isDefined(refTeamId)}
							>
								Confirm
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
