import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditIcon } from "lucide-react";
import { useState } from "react";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { isDefined } from "@/utils/types";
import type { MatchTeam } from "../tournaments/panels/games/pool-match-grid";
import {
	setMatchRefsSchema,
	setMatchRefMutationOptions,
} from "@/functions/refs/set-match-refs";
import {
	playoffMatchQueryOptions,
	poolMatchQueryOptions,
} from "@/data/matches";
import {
	useActiveTeams,
	usePlayoffsQueryOptions,
	usePoolsQueryOptions,
	useTeamsQueryOptions,
} from "../tournaments/context";
import z from "zod";
import { playerNames } from "@/utils/profiles";
import { Radio } from "../base/radio-group";
import { dbg } from "@/utils/dbg";

export type SetMatchRefsFormProps = {
	tournamentDivisionId: number;
	opponent?: MatchTeam | null;
	playoffMatchId?: number;
	poolMatchId?: number;
};

export function SetMatchRefsForm({
	tournamentDivisionId,
	playoffMatchId,
	poolMatchId,
	opponent,
	...props
}: SetMatchRefsFormProps) {
	const queryClient = useQueryClient();

	const [isOpen, setOpen] = useState(false);

	const { data: poolMatch } = useQuery({
		...poolMatchQueryOptions(poolMatchId as number),
		// this makes the cast above safe
		enabled: isDefined(poolMatchId),
	});

	const { data: playoffMatch } = useQuery({
		...playoffMatchQueryOptions(playoffMatchId as number),
		// this makes the cast above safe
		enabled: isDefined(playoffMatchId),
	});

	const matchTeams = (
		poolMatch
			? [poolMatch.teamAId, poolMatch.teamBId]
			: playoffMatch
				? [playoffMatch.teamAId, playoffMatch.teamBId]
				: []
	).filter(isDefined);

	const teams = useActiveTeams();

	const teamOptions = teams
		?.map(({ id, team }) => ({
			value: id,
			display: playerNames(team.players.map(({ profile }) => profile)).join(
				" & ",
			),
		}))
		.filter(({ value }) => !matchTeams.includes(value));

	const teamsQueryOptions = useTeamsQueryOptions();
	const poolsQueryOptions = usePoolsQueryOptions();
	const playoffsQueryOptions = usePlayoffsQueryOptions();

	const { mutate, failureReason } = useMutation({
		...setMatchRefMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(teamsQueryOptions);
			queryClient.invalidateQueries(poolsQueryOptions);
			queryClient.invalidateQueries(playoffsQueryOptions);

			setOpen(false);
		},
	});

	const schema = setMatchRefsSchema
		.pick({
			teamId: true,
			profileIds: true,
		})
		.extend({
			picker: z.enum(["team", "profile"]),
		});

	const form = useAppForm({
		defaultValues: {
			teamId: null,
			profileIds: [],
			picker: "team",
		} as z.infer<typeof schema>,
		validators: {
			onMount: schema,
			onChange: schema,
		},
		listeners: {
			onChange: ({ formApi, fieldApi }) => {
				console.log("change", fieldApi.name, fieldApi.state.value);

				if (fieldApi.name.startsWith("profileIds")) {
					formApi.setFieldValue("profileIds", (value) =>
						value.filter(isDefined),
					);
				}
			},
		},
		onSubmit: ({ value: { profileIds, teamId } }) => {
			mutate({
				poolMatchId,
				playoffMatchId,
				profileIds,
				teamId,
			});
		},
	});

	return (
		<>
			<Button
				size="xs"
				variant="text"
				className="text-blue-500 hover:text-blue-600"
				onPress={() => {
					setOpen(true);
				}}
				tooltip="Change or set refs"
			>
				<EditIcon size={12} />
			</Button>

			<Modal {...props} isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-4 relative">
					<Heading className={title({ size: "sm" })} slot="title">
						Assign Referee Duties
					</Heading>

					<form
						className="flex flex-col space-y-3"
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						{failureReason && (
							<form.AppForm>
								<form.Alert
									title={"Unable to create pools"}
									description={failureReason.message}
								/>
							</form.AppForm>
						)}

						<form.AppField name="picker">
							{(field) => (
								<field.RadioGroup field={field}>
									<Radio value="team">Select a team</Radio>
									<Radio value="profile">Search profiles</Radio>
								</field.RadioGroup>
							)}
						</form.AppField>

						<form.Subscribe
							selector={(state) => dbg(state.values, "state").picker}
						>
							{(picker) =>
								picker === "team" ? (
									<form.AppField name="teamId">
										{(field) => (
											<field.Select
												label="Select team"
												field={field}
												options={teamOptions ?? []}
											/>
										)}
									</form.AppField>
								) : (
									<form.AppField
										name="profileIds"
										mode="array"
										children={(field) => (
											<>
												<form.AppField
													name={`profileIds[${dbg(field, "profileIds").state.value.length}]`}
												>
													{(subField) => (
														<subField.ProfilePicker
															label="Search Profiles"
															field={subField}
															selectedProfileIds={field.state.value.filter(
																isDefined,
															)}
														/>
													)}
												</form.AppField>

												{field.state.value.map((_, i) => (
													<form.AppField key={i} name={`profileIds[${i}]`}>
														{(subField) => (
															<subField.ProfilePicker
																label="Search Profiles"
																field={subField}
																selectedProfileIds={field.state.value.filter(
																	isDefined,
																)}
															/>
														)}
													</form.AppField>
												))}
											</>
										)}
									/>
								)
							}
						</form.Subscribe>

						<form.AppForm>
							<form.Footer>
								<Button onPress={() => setOpen(false)}>Cancel</Button>

								<form.SubmitButton>Submit</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</>
	);
}
