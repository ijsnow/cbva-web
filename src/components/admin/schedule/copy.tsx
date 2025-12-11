import { today } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useMutation } from "@tanstack/react-query";
import {
	duplicateScheduleOptions,
	duplicateScheduleSchema,
} from "@/data/schedule";
import { useAppForm } from "../../base/form";
import { getDefaultTimeZone } from "@/lib/dates";

export function CopyScheduleForm() {
	const { mutate } = useMutation(duplicateScheduleOptions());

	const form = useAppForm({
		defaultValues: {
			startDate: today(getDefaultTimeZone()).set({ month: 1, day: 1 }),
			endDate: today(getDefaultTimeZone()).set({ month: 12, day: 31 }),
			addDays: 364,
		},
		validators: {
			onMount: duplicateScheduleSchema,
			onChange: duplicateScheduleSchema,
		},
		onSubmit: ({ value: { startDate, endDate, addDays } }) => {
			mutate({
				startDate: startDate.toString(),
				endDate: endDate.toString(),
				addDays,
			});
		},
	});

	const dateFormatter = useDateFormatter({
		dateStyle: "short",
	});

	return (
		<form
			className="flex flex-col gap-2"
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			<form.Alert
				color="info"
				title="Info"
				description="You cannot undo this. However you can use the delete schedule form to delete all tournaments in the range of dates for tournaments created by this action."
			/>

			<form.AppField
				name="startDate"
				children={(field) => (
					<field.DatePicker
						label="Start Date"
						className="col-span-2"
						field={field}
					/>
				)}
			/>

			<form.AppField
				name="endDate"
				children={(field) => (
					<field.DatePicker
						label="End Date"
						className="col-span-2"
						field={field}
					/>
				)}
			/>

			<form.AppField
				name="addDays"
				children={(field) => (
					<field.Number
						label="Jump Days"
						className="col-span-2"
						field={field}
						minValue={1}
					/>
				)}
			/>

			<form.AppForm>
				<form.Footer>
					<form.ConfirmSubmitButton
						requireChange={false}
						description={
							<div className="flex flex-col space-y">
								<div className="flex flex-row space-x-2">
									<span className="font-semibold">Start date:</span>
									<span>
										{dateFormatter.format(
											form.state.values.startDate.toDate(getDefaultTimeZone()),
										)}
									</span>
								</div>
								<div className="flex flex-row space-x-2">
									<span className="font-semibold">End date:</span>
									<span>
										{dateFormatter.format(
											form.state.values.endDate.toDate(getDefaultTimeZone()),
										)}
									</span>
								</div>
								<div className="flex flex-row space-x-2">
									<span className="font-semibold">Jump days:</span>
									<span>{form.state.values.addDays}</span>
								</div>
								<p className="mt-2">
									If you want to undo this action, use the{" "}
									<span className="font-semibold italic">Delete Schedule</span>{" "}
									form to delete the generated range.
								</p>
							</div>
						}
					>
						Submit
					</form.ConfirmSubmitButton>
				</form.Footer>
			</form.AppForm>
		</form>
	);
}
