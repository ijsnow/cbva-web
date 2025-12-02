import { getLocalTimeZone, today } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useMutation } from "@tanstack/react-query";
import { deleteScheduleOptions, deleteScheduleSchema } from "@/data/schedule";
import { useAppForm } from "../../base/form";

export function DeleteScheduleForm() {
	const { mutate } = useMutation(deleteScheduleOptions());

	const form = useAppForm({
		defaultValues: deleteScheduleSchema.parse({
			startDate: today(getLocalTimeZone())
				.set({ month: 1, day: 1 })
				.add({ years: 1 }),
			endDate: today(getLocalTimeZone())
				.set({ month: 12, day: 31 })
				.add({ years: 1 }),
		}),
		validators: {
			onMount: deleteScheduleSchema,
			onChange: deleteScheduleSchema,
		},
		onSubmit: ({ value: { startDate, endDate } }) => {
			mutate({
				startDate: startDate.toString(),
				endDate: endDate.toString(),
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
				color="warning"
				title={"Warning!"}
				description="You cannot undo this. However, you can copy a schedule again."
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
											form.state.values.startDate.toDate(getLocalTimeZone()),
										)}
									</span>
								</div>
								<div className="flex flex-row space-x-2">
									<span className="font-semibold">End date:</span>
									<span>
										{dateFormatter.format(
											form.state.values.endDate.toDate(getLocalTimeZone()),
										)}
									</span>
								</div>
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
