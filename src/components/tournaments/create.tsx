import {
	type CalendarDate,
	getLocalTimeZone,
	Time,
	today,
} from "@internationalized/date";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import { match, P } from "ts-pattern";
import { z } from "zod/v4";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { divisionsQueryOptions } from "@/data/divisions";
import { venuesQueryOptions } from "@/data/venues";
import type { CreateTournament } from "@/db/schema";

const schema = z.object({
	name: z.string().optional(),
	date: z
		.any()
		.refine((value) => Boolean(value), {
			message: "This field is required",
		})
		.refine(
			(value: CalendarDate) => {
				if (!value) {
					return true;
				}

				const todayDate = today(getLocalTimeZone());

				return value > todayDate;
			},
			{
				message: "Date must be in the future",
			},
		),
	start_time: z.any().refine((value) => Boolean(value), {
		message: "This field is required",
	}),
	venue_id: z.any().nonoptional(),
	registration_fee: z.number().min(0),
	division_ids: z.set(z.int32()).min(1),
});

export type CreateTournamentProps = {
	initialValues?: CreateTournament;
	showBackButton?: boolean;
};

export function CreateTournamentForm({
	initialValues,
	showBackButton,
}: CreateTournamentProps) {
	// const { mutate, failureReason } = useCreateTournament()

	const failureReason = null;

	const router = useRouter();

	const form = useAppForm({
		defaultValues:
			initialValues ||
			({
				name: "",
				venue_id: "",
				registration_fee: 75,
				start_time: new Time(9),
				division_ids: new Set(),
			} as Partial<
				Omit<CreateTournament, "date" | "start_time" | "division_ids"> & {
					date: CalendarDate;
					start_time: Time;
					division_ids: Set<number>;
				}
			>),
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { date, start_time, division_ids, ...value } }) => {
			// mutate(
			//   {
			//     ...(value as Omit<
			//       CreateTournamentParams,
			//       "date" | "start_time" | "division_ids"
			//     >),
			//     date: date!.toString(),
			//     start_time: formatTime(start_time!),
			//     division_ids: Array.from(division_ids!),
			//   },
			//   {
			//     onSuccess: () => {
			//       router.history.back()
			//     },
			//   }
			// )
		},
	});

	const { data: venues } = useSuspenseQuery({
		...venuesQueryOptions(),
		select: (data) =>
			data.map(({ id, name, city }) => ({
				value: id,
				display: `${name}, ${city}`,
			})),
	});

	const { data: divisions } = useSuspenseQuery({
		...divisionsQueryOptions(),
		select: (divisions) =>
			divisions.map(({ id, name }) => ({
				value: id,
				display: name.toUpperCase(),
			})),
	});

	return (
		<form
			className="grid grid-cols-6 gap-4"
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			{failureReason && (
				<form.Alert
					className="col-span-full"
					color="error"
					title="Uh oh!"
					description={failureReason.message}
				/>
			)}

			<form.AppField
				name="venueId"
				children={(field) => (
					<field.ComboBox
						className="col-span-full"
						label="Venue"
						field={field}
						options={venues}
						isDisabled={Boolean(initialValues)}
					/>
				)}
			/>

			<form.AppField
				name="name"
				children={(field) => (
					<field.Text className="col-span-full" label="Name" field={field} />
				)}
			/>

			<form.AppField
				name="divisionIds"
				children={(field) => (
					<field.MultiSelect
						className="col-span-full"
						label="Divisions"
						isRequired
						field={field}
						options={divisions || []}
					/>
				)}
			/>

			<form.AppField
				name="date"
				children={(field) => (
					<field.DatePicker
						isRequired
						className="col-span-3"
						label="Date"
						field={field}
						minValue={today(getLocalTimeZone())}
					/>
				)}
			/>

			<form.AppField
				name="start_time"
				children={(field) => (
					<field.Time
						isRequired
						className="col-span-3"
						label="Start Time"
						field={field}
					/>
				)}
			/>

			<form.AppField
				name="registration_fee"
				children={(field) => (
					<field.Number
						isRequired
						label="Fee"
						className="col-span-3"
						formatOptions={{ style: "currency", currency: "USD" }}
						field={field}
					/>
				)}
			/>

			<form.AppForm>
				<form.Footer className="col-span-full">
					{showBackButton && (
						<Button onPress={() => router.history.back()}>
							<ChevronLeftIcon />
							Back
						</Button>
					)}

					<form.SubmitButton>Create</form.SubmitButton>
				</form.Footer>
			</form.AppForm>
		</form>
	);
}
