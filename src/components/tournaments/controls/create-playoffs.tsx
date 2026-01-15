import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { playoffsQueryOptions } from "@/data/playoffs";
import {
	createPlayoffsMutationOptions,
	createPlayoffsSchema,
} from "@/functions/playoffs/create-playoffs";
import type { Division, TournamentDivision } from "@/db/schema";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { useActiveTeams } from "../context";
import z from "zod";
import { Radio } from "@/components/base/radio-group";
import {
	Disclosure,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";

type MatchKind = "set" | "match";

export type CreatePlayoffsFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreatePlayoffsForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: CreatePlayoffsFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...createPlayoffsMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				playoffsQueryOptions({ tournamentDivisionId: division.id }),
			);

			onOpenChange(false);
		},
	});

	const schema = createPlayoffsSchema
		.pick({
			teamCount: true,
			wildcardCount: true,
			sets: true,
			assignCourts: true,
			overwrite: true,
		})
		.extend({
			matchKind: z.enum<MatchKind[]>(["set", "match"]),
		});

	const form = useAppForm({
		defaultValues: {
			teamCount: 10,
			wildcardCount: 2,
			matchKind: "set" as MatchKind,
			sets: [
				{
					winScore: 28,
					switchScore: 7,
				},
			],
			assignCourts: true,
			overwrite: false,
		} as z.infer<typeof schema>,
		validators: {
			onMount: schema,
			onChange: schema,
		},
		listeners: {
			onChange: ({ fieldApi, formApi }) => {
				if (fieldApi.name === "matchKind") {
					const sets =
						fieldApi.state.value === "set"
							? [
									{
										winScore: 28,
										switchScore: 7,
									},
								]
							: [
									{
										winScore: 21,
										switchScore: 7,
									},
									{
										winScore: 21,
										switchScore: 7,
									},
									{
										winScore: 15,
										switchScore: 5,
									},
								];

					formApi.setFieldValue("sets", sets);
				}
			},
		},
		onSubmit: ({
			value: { teamCount, wildcardCount, sets, assignCourts, overwrite },
		}) => {
			mutate({
				id: division.id,
				teamCount,
				wildcardCount,
				assignCourts,
				overwrite,
				sets,
			});
		},
	});

	const teams = useActiveTeams();

	const teamCount = teams?.length ?? "loading...";

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Create Playoffs
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Create the playoff bracket for the{" "}
					<span className="font-bold italic">
						{getTournamentDivisionDisplay(division)}
					</span>{" "}
					division. If you want to recreate the bracket entirely, select{" "}
					<span className="font-semibold italic">Overwrite existing</span>.
				</p>

				{teamCount && (
					<p className="text-sm text-gray-700 mb-6">
						There are <span className="font-bold italic">{teamCount}</span>{" "}
						teams in this division.
					</p>
				)}

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
								title={"Unable to create playoffs"}
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppField
						name="teamCount"
						children={(field) => (
							<field.Number label="Team Count" field={field} minValue={1} />
						)}
					/>

					<form.AppField
						name="wildcardCount"
						children={(field) => (
							<field.Number label="Wildcard Count" field={field} minValue={0} />
						)}
					/>

					<div className="flex flex-col gap-3">
						<form.AppField
							name="matchKind"
							children={(field) => (
								<field.RadioGroup
									label="Match Style"
									orientation="horizontal"
									field={field}
								>
									<Radio value="set">Single Set</Radio>
									<Radio value="match">Best of 3</Radio>
								</field.RadioGroup>
							)}
						/>

						<Disclosure card={false}>
							<DisclosureHeader card={false} size="sm">
								Score Options
							</DisclosureHeader>
							<DisclosurePanel card={false}>
								<form.AppField name="sets" mode="array">
									{(field) => (
										<div className="flex flex-col space-y-2">
											{field.state.value.map((_, i) => (
												<div className="grid grid-cols-6 gap-3" key={i}>
													<form.AppField name={`sets[${i}].winScore`}>
														{(subField) => (
															<>
																<subField.Number
																	className="col-span-3"
																	field={subField}
																	label={i === 0 ? "Win Score" : null}
																/>
															</>
														)}
													</form.AppField>
													<form.AppField name={`sets[${i}].switchScore`}>
														{(subField) => (
															<>
																<subField.Number
																	className="col-span-3"
																	field={subField}
																	label={i === 0 ? "Switch Every" : null}
																/>
															</>
														)}
													</form.AppField>
												</div>
											))}
										</div>
									)}
								</form.AppField>
							</DisclosurePanel>
						</Disclosure>
					</div>

					<form.AppField
						name="assignCourts"
						children={(field) => (
							<field.Checkbox
								label="Assign courts based on pools and seeds"
								field={field}
							/>
						)}
					/>

					<form.AppField
						name="overwrite"
						children={(field) => (
							<field.Checkbox label="Overwrite existing" field={field} />
						)}
					/>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton requireChange={false}>
								Create
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
