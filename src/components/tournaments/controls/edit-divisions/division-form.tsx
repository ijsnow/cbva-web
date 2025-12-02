import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { title } from "@/components/base/primitives";
import { divisionsQueryOptions } from "@/data/divisions";
import { tournamentQueryOptions } from "@/data/tournaments";
import {
	upsertTournamentDivisionMutationOptions,
	upsertTournamentDivisionSchema,
} from "@/data/tournaments/divisions";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { isNotNullOrUndefined } from "@/utils/types";

export type DivisionFormProps = {
	tournamentId: number;
	divisionId?: number;
	showTitle?: boolean;
	onCancel: () => void;
};

export function DivisionForm({
	tournamentId,
	divisionId,
	showTitle = true,
	onCancel,
}: DivisionFormProps) {
	const { data: divisions } = useSuspenseQuery({
		...divisionsQueryOptions(),
	});

	const divisionOptions = divisions.map(({ id, display, name, maxAge }) => ({
		value: id,
		display: display ?? name.toUpperCase(),
		hasMaxAge: isNotNullOrUndefined(maxAge),
	}));

	const { data: editDivision } = useSuspenseQuery({
		...tournamentQueryOptions(tournamentId),
		select: (data) =>
			data?.tournamentDivisions.find(({ id }) => divisionId === id),
	});

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...upsertTournamentDivisionMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(tournamentQueryOptions(tournamentId));

			onCancel();
		},
	});

	const schema = upsertTournamentDivisionSchema.omit({
		tournamentId: true,
	});

	const form = useAppForm({
		defaultValues: {
			id: divisionId,
			divisionId: editDivision?.divisionId,
			name: editDivision?.name,
			gender: editDivision?.gender,
			capacity: editDivision?.capacity,
			waitlistCapacity: editDivision?.waitlistCapacity,
			autopromoteWaitlist: editDivision?.autopromoteWaitlist,
			teamSize: editDivision?.teamSize ?? 2,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({
			value: {
				id,
				divisionId,
				name,
				gender,
				capacity,
				waitlistCapacity,
				autopromoteWaitlist,
				teamSize,
			},
		}) => {
			mutate({
				id,
				tournamentId,
				name,
				divisionId,
				gender,
				capacity,
				waitlistCapacity,
				autopromoteWaitlist,
				teamSize,
			});
		},
	});

	return (
		<form
			className="grid grid-cols-6 gap-3"
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			{showTitle && (
				<h3 className={title({ size: "xs", class: "col-span-full" })}>
					{divisionId ? "Edit Division" : "Add Division"}
				</h3>
			)}

			{failureReason && (
				<form.AppForm>
					<form.Alert
						className="col-span-full"
						title={`Unable to ${divisionId ? "edit" : "add"} division.`}
						description={failureReason.message}
					/>
				</form.AppForm>
			)}

			<form.AppField
				name="divisionId"
				children={(field) => (
					<field.Select
						isRequired={true}
						label="Division"
						field={field}
						options={divisionOptions}
						placeholder="Select a division"
						className="col-span-full"
					/>
				)}
			/>

			<form.Subscribe selector={(state) => [state.values.divisionId]}>
				{([divisionId]) => {
					const selectedDivision = divisionOptions.find(
						({ value }) => value === divisionId,
					);

					return (
						<form.AppField
							name="gender"
							children={(field) => (
								<field.Select
									isRequired={true}
									label="Gender"
									className="col-span-full sm:col-span-3"
									field={field}
									isDisabled={!selectedDivision}
									options={[
										{
											value: "male",
											display: selectedDivision?.hasMaxAge ? "Boy's" : "Men's",
										},
										{
											value: "female",
											display: selectedDivision?.hasMaxAge
												? "Girl's"
												: "Women's",
										},
									]}
									placeholder="Select"
								/>
							)}
						/>
					);
				}}
			</form.Subscribe>

			<form.AppField
				name="teamSize"
				children={(field) => (
					<field.Number
						isRequired={true}
						label="Team Size"
						className="col-span-full sm:col-span-3"
						field={field}
					/>
				)}
			/>

			<form.Subscribe
				selector={(state) => ({
					values: state.values,
				})}
			>
				{({ values: { name, gender, teamSize, divisionId, ...values } }) => {
					const division = divisions.find(({ id }) => id === divisionId);

					const placeholder =
						division && gender && teamSize
							? getTournamentDivisionDisplay({
									division,
									name: name ?? null,
									gender,
									teamSize,
									...values,
								})
							: undefined;

					return (
						<form.AppField
							name="name"
							children={(field) => (
								<field.Text
									label="Name"
									field={field}
									placeholder={placeholder}
									className="col-span-full"
								/>
							)}
						/>
					);
				}}
			</form.Subscribe>

			<form.AppField
				name="capacity"
				children={(field) => (
					<field.Number
						isRequired={true}
						label="Capacity"
						className="col-span-full sm:col-span-3"
						field={field}
					/>
				)}
			/>

			<form.AppField
				name="waitlistCapacity"
				children={(field) => (
					<field.Number
						isRequired={true}
						label="Waitlist Capacity"
						className="col-span-full sm:col-span-3"
						field={field}
					/>
				)}
			/>

			<form.AppField
				name="autopromoteWaitlist"
				children={(field) => (
					<field.Checkbox
						className="col-span-full"
						label="Auto Promote from Waitlist"
						field={field}
					/>
				)}
			/>

			<form.AppForm>
				<form.Footer>
					<Button onPress={onCancel}>Cancel</Button>

					<form.SubmitButton>Submit</form.SubmitButton>
				</form.Footer>
			</form.AppForm>
		</form>
	);
}
