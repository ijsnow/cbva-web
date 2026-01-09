import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import {
	removeTeamMutationOptions,
	removeTeamSchema,
} from "@/functions/teams/remove-team";
import {
	useIsTournamentToday,
	usePoolsQueryOptions,
	useTeamsQueryOptions,
	useWaitlist,
} from "@/components/tournaments/context";
import type z from "zod";
import { useEffect } from "react";
import { playerNames } from "@/utils/profiles";
import { dbg } from "@/utils/dbg";

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
	const poolsQueryOptions = usePoolsQueryOptions();

	const { mutate, failureReason } = useMutation({
		...removeTeamMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(teamQueryOptions);
			queryClient.invalidateQueries(poolsQueryOptions);

			props.onOpenChange(false);
		},
	});

	const waitlist = useWaitlist();

	const isTournamentToday = useIsTournamentToday();

	const schema = removeTeamSchema.omit({ id: true });

	const form = useAppForm({
		defaultValues: {
			late: isTournamentToday,
			replace: false,
			replacementTeamId: null,
		} as z.infer<typeof schema>,
		validators: {
			onMount: schema,
			onChange: schema,
		},
		listeners: {
			onChange: ({ formApi, fieldApi }) => {
				if (fieldApi.name === "replace") {
					if (fieldApi.state.value) {
						if (waitlist && waitlist.length > 0) {
							formApi.setFieldValue("replacementTeamId", waitlist[0].id);
						}
					} else {
						formApi.setFieldValue("replacementTeamId", null);
					}
				}
			},
		},
		onSubmit: ({ value: { late, replacementTeamId } }) => {
			mutate({
				id: tournamentDivisionTeamId,
				late,
				replacementTeamId,
			});
		},
	});

	useEffect(() => {
		if (!props.isOpen) {
			form.reset();
		}
	}, [props.isOpen, form]);

	return (
		<Modal {...props}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Remove Team?
				</Heading>

				<p className="text-sm text-gray-700 mb-8">
					Are you sure you want to remove this team from the division?
				</p>

				<form
					className="flex flex-col space-y-2"
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

					<form.AppField name="late">
						{(field) => (
							<field.Checkbox field={field} label="Mark as late withdrawl" />
						)}
					</form.AppField>

					<form.AppField name="replace">
						{(field) => (
							<field.Checkbox
								field={field}
								isDisabled={waitlist ? waitlist.length === 0 : true}
								label="Replace from waitlist"
								info={
									<>
										Replaces the team in their pool and matches with a team from
										the waitlist and uses the same seed.
									</>
								}
							/>
						)}
					</form.AppField>

					<form.AppField name="replacementTeamId">
						{(field) => (
							<form.Subscribe
								selector={({ values: { replace, replacementTeamId } }) => [
									replace,
									replacementTeamId,
								]}
							>
								{([replace, replacementTeamId]) =>
									replace && (
										<field.Select
											key={dbg(replacementTeamId)}
											label="Replacement Team"
											options={
												waitlist?.map((team) => ({
													value: team.id,
													display: playerNames(
														team.team.players.map(({ profile }) => profile),
													).join(" & "),
												})) ?? []
											}
											field={field}
										/>
									)
								}
							</form.Subscribe>
						)}
					</form.AppField>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => props.onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton requireChange={false}>
								Confirm
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
