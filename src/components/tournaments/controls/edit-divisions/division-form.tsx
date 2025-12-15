import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { pick } from "lodash-es";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Header } from "react-aria-components";
import { Button } from "@/components/base/button";
import {
	Disclosure,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";
import { useAppForm } from "@/components/base/form";
import { Information } from "@/components/base/information";
import { title } from "@/components/base/primitives";
import { divisionsQueryOptions } from "@/data/divisions";
import { tournamentQueryOptions } from "@/data/tournaments";
import {
	upsertTournamentDivisionMutationOptions,
	upsertTournamentDivisionSchema,
} from "@/data/tournaments/divisions";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { dbg } from "@/utils/dbg";
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
			capacity: editDivision?.capacity ?? 10,
			waitlistCapacity: editDivision?.waitlistCapacity ?? 5,
			autopromoteWaitlist: editDivision?.autopromoteWaitlist ?? true,
			teamSize: editDivision?.teamSize ?? 2,
			displayGender: editDivision?.displayGender,
			displayDivision: editDivision?.displayDivision,
			requirements: editDivision?.requirements,
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
				requirements,
				displayGender,
				displayDivision,
			},
		}) => {
			console.log("here");

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
				displayGender,
				displayDivision,
				requirements,
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
									options={[
										{
											value: "male",
											display: selectedDivision
												? selectedDivision.hasMaxAge
													? "Boy's"
													: "Men's"
												: "Men's/Boy's",
										},
										{
											value: "female",
											display: selectedDivision
												? selectedDivision.hasMaxAge
													? "Girl's"
													: "Women's"
												: "Women's/Girl's",
										},
										{
											value: "coed",
											display: "Coed",
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
				name="divisionId"
				children={(field) => (
					<field.Select
						isRequired={true}
						label="Division"
						field={field}
						options={divisionOptions}
						placeholder="Select a division"
						className="col-span-3"
					/>
				)}
			/>

			<Disclosure className="col-span-full" card={false}>
				<DisclosureHeader size="sm" card={false}>
					<span>Extra Options</span>
				</DisclosureHeader>

				<DisclosurePanel
					card={false}
					contentClassName="col-span-full grid grid-cols-6 gap-3"
				>
					<form.Subscribe
						selector={(state) => ({
							values: state.values,
						})}
					>
						{({
							values: { name, gender, teamSize, divisionId, ...values },
						}) => {
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
								<>
									<form.AppField
										name="name"
										children={(field) => (
											<field.Text
												label={
													<>
														Name: <span>{placeholder ?? "-"}</span>
													</>
												}
												field={field}
												placeholder={placeholder}
												className="col-span-4"
											/>
										)}
									/>
									<form.AppField
										name="teamSize"
										children={(field) => (
											<field.Number
												isRequired={true}
												label="Team Size"
												className="col-span-full sm:col-span-2"
												field={field}
											/>
										)}
									/>
									<div className="col-span-full flex flex-row space-x-2">
										<form.AppField
											name="displayGender"
											children={(field) => (
												<field.Checkbox
													label={<>Display gender</>}
													field={field}
													className="col-span-3"
													isDisabled={!name}
												/>
											)}
										/>
										<form.AppField
											name="displayDivision"
											children={(field) => (
												<field.Checkbox
													label={<>Display division</>}
													field={field}
													className="col-span-3"
													isDisabled={!name}
												/>
											)}
										/>
									</div>
								</>
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
				</DisclosurePanel>
			</Disclosure>

			<Disclosure className="col-span-full" card={false}>
				<DisclosureHeader
					size="sm"
					card={false}
					info={
						<>
							Add requirements to run special formats such as Mother/Daughter,
							coed, etc.
						</>
					}
				>
					<span>Special Requirements</span>
				</DisclosureHeader>

				<DisclosurePanel card={false}>
					<form.AppField name="requirements" mode="array">
						{(field) => (
							<div className="col-span-full grid grid-cols-6 gap-3">
								<div className="col-span-full flex flex-col items-stretch space-y-2">
									{field.state.value?.map((req, i) => {
										const selectedDivision = divisionOptions.find(
											({ value }) => value === req.qualifiedDivisionId,
										);

										return (
											<>
												<span className="font-semibold">
													Player {i + 1} requirement
												</span>
												<form.AppField name={`requirements[${i}].gender`}>
													{(subField) => (
														<>
															<subField.Select
																label="Gender"
																field={subField}
																options={[
																	{
																		value: "male",
																		display: selectedDivision?.hasMaxAge
																			? "Boy's"
																			: "Men's",
																	},
																	{
																		value: "female",
																		display: selectedDivision?.hasMaxAge
																			? "Girl's"
																			: "Women's",
																	},
																]}
																placeholder="Select a gender"
																className="col-span-full"
															/>
														</>
													)}
												</form.AppField>
												<form.AppField
													name={`requirements[${i}].qualifiedDivisionId`}
												>
													{(subField) => (
														<subField.Select
															label="Division"
															field={subField}
															options={divisionOptions}
															placeholder="Select a division"
															className="col-span-full"
														/>
													)}
												</form.AppField>
											</>
										);
									})}
									<form.Subscribe
										selector={(state) =>
											pick(state.values, ["requirements", "teamSize", "gender"])
										}
									>
										{({ teamSize, requirements }) => (
											<Button
												className="cols-span-full "
												size="sm"
												isDisabled={
													requirements ? requirements.length >= teamSize : false
												}
												onPress={() => {
													field.handleChange((curr) =>
														(curr ?? []).concat({
															gender: null,
															qualifiedDivisionId: null,
															tournamentDivisionId: divisionId,
														}),
													);
												}}
											>
												<PlusIcon size={16} /> Add requirement
											</Button>
										)}
									</form.Subscribe>
								</div>
							</div>
						)}
					</form.AppField>
				</DisclosurePanel>
			</Disclosure>

			<form.AppForm>
				<form.Footer>
					<Button onPress={onCancel}>Cancel</Button>

					<form.SubmitButton>Submit</form.SubmitButton>
				</form.Footer>
			</form.AppForm>
		</form>
	);
}
