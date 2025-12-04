import {
	type CalendarDate,
	parseDate,
	parseTime,
	type Time,
} from "@internationalized/date";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { teamsQueryOptions } from "@/data/teams";
import {
	editDateMutationOptions,
	editDateSchema,
	tournamentQueryOptions,
} from "@/data/tournaments";
import type { Division, TournamentDivision } from "@/db/schema";
import { calendarDateSchema, timeSchema } from "@/lib/schemas";

export type EditDateFormProps = {
	tournamentId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditDateForm({
	tournamentId,
	onOpenChange,
	...props
}: EditDateFormProps) {
	const { data: tournament } = useSuspenseQuery({
		...tournamentQueryOptions(tournamentId),
		select: (data) =>
			data
				? {
						date: parseDate(data.date),
						startTime: parseTime(data.startTime),
					}
				: undefined,
	});

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...editDateMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(tournamentQueryOptions(tournamentId));

			onOpenChange(false);
		},
	});

	const schema = editDateSchema.pick({}).extend({
		date: calendarDateSchema().refine((date) => {
			return true;
		}),
		startTime: timeSchema(),
	});

	const form = useAppForm({
		defaultValues: {
			date: tournament?.date as CalendarDate,
			startTime: tournament?.startTime as Time,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { date, startTime } }) => {
			mutate({
				id: tournamentId,
				date: date.toString(),
				startTime: startTime.toString(),
			});
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Edit Scheduling
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
								title={"Unable to edit scheduling"}
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppField
						name="date"
						children={(field) => (
							<field.DatePicker label="Date" field={field} />
						)}
					/>

					<form.AppField
						name="startTime"
						children={(field) => (
							<field.Time label="Start Time" field={field} />
						)}
					/>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton requireChange={false}>
								Calculate
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
