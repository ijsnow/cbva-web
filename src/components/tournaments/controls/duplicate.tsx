import {
	type CalendarDate,
	getLocalTimeZone,
	today,
} from "@internationalized/date";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Heading } from "react-aria-components";
import z from "zod";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { duplicateTournamentOptions } from "@/data/schedule";

export type DuplicateFormProps = {
	tournamentId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

const schema = z.object({
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
});

export function DuplicateForm({
	tournamentId,
	onOpenChange,
	...props
}: DuplicateFormProps) {
	const navigate = useNavigate();

	const { mutate } = useMutation({
		...duplicateTournamentOptions(),
		onSuccess: ({ data }) => {
			onOpenChange(false);

			navigate({
				to: "/tournaments/$tournamentId",
				params: {
					tournamentId: data.id.toString(),
				},
			});
		},
	});

	const form = useAppForm({
		defaultValues: {
			date: today(getLocalTimeZone()).add({ days: 1 }),
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { date } }) => {
			mutate({
				id: tournamentId,
				date: date.toString(),
			});
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Duplicate Tournament
				</Heading>

				<form
					onSubmit={(e) => {
						e.preventDefault();

						form.handleSubmit();
					}}
				>
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

					<form.AppForm>
						<form.Footer className="col-span-full">
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton requireChange={false}>
								Duplicate
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
