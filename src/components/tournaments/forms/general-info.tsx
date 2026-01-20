import { parseTime, today } from "@internationalized/date";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type z from "zod";
import {
	tournamentQueryOptions,
	upsertTournamentMutationOptions,
	upsertTournamentSchema,
} from "@/data/tournaments";
import { useVenueFilterOptions } from "@/data/venues";
import { getDefaultTimeZone } from "@/lib/dates";
import { calendarDateSchema, timeSchema } from "@/lib/schemas";
import { isDefined } from "@/utils/types";
import { useAppForm } from "../../base/form";

const schema = upsertTournamentSchema
	.omit({
		date: true,
		startTime: true,
	})
	.extend({
		date: calendarDateSchema(),
		startTime: timeSchema(),
	});

export type UpsertTournamentFormProps = {
	tournamentId?: number;
	defaultValues?: z.infer<typeof schema>;
};

export function UpsertTournamentForm({
	tournamentId,
	defaultValues = {
		name: "",
		date: today(getDefaultTimeZone()).add({ days: 1 }),
		startTime: parseTime("09:00:00"),
		venueId: null,
	} as unknown as z.infer<typeof schema>,
}: UpsertTournamentFormProps) {
	const navigate = useNavigate();

	const venueOptions = useVenueFilterOptions();

	const isEdit = isDefined(tournamentId);
	const isCreate = !isDefined(tournamentId);

	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		...upsertTournamentMutationOptions(),
		onSuccess: ({ data: { id } }) => {
			if (isEdit) {
				queryClient.invalidateQueries(tournamentQueryOptions(id));
			} else {
				navigate({
					to: "/tournaments/$tournamentId/edit",
					params: {
						tournamentId: id.toString(),
					},
				});
			}
		},
	});

	const form = useAppForm({
		defaultValues,
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { name, date, startTime, venueId }, formApi }) => {
			mutate(
				{
					id: tournamentId,
					name,
					date: date.toString(),
					startTime: startTime.toString(),
					venueId,
				},
				{
					onSuccess: () => {
						formApi.reset();
					},
				},
			);
		},
	});

	return (
		<form
			className="grid grid-cols-6 gap-3"
			onSubmit={(event) => {
				event.preventDefault();

				form.handleSubmit();
			}}
		>
			<form.AppField name="venueId">
				{(field) => (
					<field.ComboBox
						validationBehavior="aria"
						isRequired={true}
						label="Location"
						field={field}
						className="col-span-full"
						options={venueOptions}
					/>
				)}
			</form.AppField>

			<form.AppField name="date">
				{(field) => (
					<field.DatePicker
						isRequired={true}
						label="Date"
						field={field}
						className="col-span-3"
					/>
				)}
			</form.AppField>

			<form.AppField name="startTime">
				{(field) => (
					<field.Time
						isRequired={true}
						label="Start Time"
						field={field}
						className="col-span-3"
					/>
				)}
			</form.AppField>

			<form.AppField name="name">
				{(field) => (
					<field.Text label="Name" field={field} className="col-span-full" />
				)}
			</form.AppField>

			<form.AppForm>
				<form.Footer className="col-span-full">
					<form.SubmitButton>{isCreate ? "Create" : "Save"}</form.SubmitButton>
				</form.Footer>
			</form.AppForm>
		</form>
	);
}
