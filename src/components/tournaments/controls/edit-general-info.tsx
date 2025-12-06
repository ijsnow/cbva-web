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
import {
	editTournamentMutationOptions,
	editTournamentSchema,
	tournamentQueryOptions,
} from "@/data/tournaments";
import { useVenueFilterOptions } from "@/data/venues";
import { calendarDateSchema, timeSchema } from "@/lib/schemas";

export type EditGeneralInfoFormProps = {
	tournamentId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditGeneralInfoForm({
	tournamentId,
	onOpenChange,
	...props
}: EditGeneralInfoFormProps) {
	const { data: tournament } = useSuspenseQuery({
		...tournamentQueryOptions(tournamentId),
		select: (data) =>
			data
				? {
						date: parseDate(data.date),
						startTime: parseTime(data.startTime),
						venueId: data.venueId,
					}
				: undefined,
	});

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...editTournamentMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(tournamentQueryOptions(tournamentId));

			onOpenChange(false);
		},
	});

	const schema = editTournamentSchema.pick({ venueId: true }).extend({
		date: calendarDateSchema().refine((date) => {
			return true;
		}),
		startTime: timeSchema(),
	});

	const form = useAppForm({
		defaultValues: {
			date: tournament?.date as CalendarDate,
			startTime: tournament?.startTime as Time,
			venueId: tournament?.venueId as number,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { date, startTime, venueId } }) => {
			mutate({
				id: tournamentId,
				date: date.toString(),
				startTime: startTime.toString(),
				venueId,
			});
		},
	});

	const venueOptions = useVenueFilterOptions();

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
						name="venueId"
						children={(field) => (
							<field.ComboBox
								label="Location"
								field={field}
								options={venueOptions.map(({ display, value }) => ({
									display,
									value,
								}))}
							/>
						)}
					/>

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
