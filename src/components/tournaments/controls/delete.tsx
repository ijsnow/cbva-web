import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";
import { Heading } from "react-aria-components";
import z from "zod";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import {
	deleteTournamentMutationOptions,
	deleteTournamentSchema,
	tournamentQueryOptions,
} from "@/data/tournaments";
import { getDefaultTimeZone } from "@/lib/dates";

export type DeleteTournamentFormProps = {
	tournamentId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
};

export function DeleteTournamentForm({
	tournamentId,
	onOpenChange,
	onSuccess,
	...props
}: DeleteTournamentFormProps) {
	const { mutate, failureReason } = useMutation({
		...deleteTournamentMutationOptions(),
		onSuccess: () => {
			onSuccess();
			onOpenChange(false);
		},
	});

	const dateFormatter = useDateFormatter();

	const { data } = useQuery(tournamentQueryOptions(tournamentId));

	const schema = deleteTournamentSchema.extend({
		confirm: z.literal(true),
	});

	const form = useAppForm({
		defaultValues: {
			id: tournamentId,
			confirm: false,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { id, confirm } }) => {
			if (confirm) {
				mutate({
					id,
				});
			}
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading
					className={title({
						size: "sm",
						class: "flex flex-row space-x-2 items-center text-red-500",
					})}
					slot="title"
				>
					<AlertTriangleIcon className="inline" />
					<span>Delete Tournament</span>
				</Heading>

				{data && (
					<div className="italic font-semibold">
						{data.name && <p className="text-lg">{data.name}</p>}
						<p>
							{data.venue.name}, {data.venue.city}{" "}
							{dateFormatter.format(
								parseDate(data.date).toDate(getDefaultTimeZone()),
							)}
						</p>
					</div>
				)}

				<p>
					Are you sure you want to delete this tournament? You can't undo this,
					but you can create another tournament with the same settings.
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
								title={"Unable to delete tournament"}
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppField name="confirm">
						{(field) => (
							<field.Checkbox
								label="I'm sure I want to delete this."
								field={field}
							/>
						)}
					</form.AppField>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton requireChange={false}>
								Delete
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
