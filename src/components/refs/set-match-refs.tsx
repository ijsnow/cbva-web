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
import { useActiveTeams } from "../tournaments/context";
import z from "zod";
import { playerNames } from "@/utils/profiles";
import { Radio } from "../base/radio-group";
import { teamsQueryOptions } from "@/functions/teams/get-teams";
import { getPoolsQueryOptions } from "@/functions/pools/get-pools";
import { playoffsQueryOptions } from "@/functions/playoffs/get-playoffs";

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

	const teams = useActiveTeams(tournamentDivisionId);

	const teamOptions = teams
		?.map(({ id, team }) => ({
			value: id,
			display: playerNames(team.players.map(({ profile }) => profile)).join(
				" & ",
			),
		}))
		.filter(({ value }) => !matchTeams.includes(value));

	const { mutate, failureReason } = useMutation({
		...setMatchRefMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				teamsQueryOptions({ tournamentDivisionId }),
			);
			queryClient.invalidateQueries(
				getPoolsQueryOptions({ tournamentDivisionId }),
			);
			queryClient.invalidateQueries(
				playoffsQueryOptions({ tournamentDivisionId }),
			);

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
				if (fieldApi.name.startsWith("profileIds")) {
					formApi.setFieldValue("profileIds", (value) =>
						value.filter(isDefined),
					);
				}
			},
		},
		onSubmit: ({ value: { profileIds, teamId }, formApi }) => {
			mutate(
				{
					poolMatchId,
					playoffMatchId,
					profileIds,
					teamId,
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

					<p>
						Assign reffing duties. This action removes any existing refs for
						this match.
					</p>

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
								<field.RadioGroup
									field={field}
									orientation="horizontal"
									className="mb-2"
								>
									<Radio value="team">Select a team</Radio>
									<Radio value="profile">Search profiles</Radio>
								</field.RadioGroup>
							)}
						</form.AppField>

						<form.Subscribe selector={(state) => state.values.picker}>
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
													name={`profileIds[${field.state.value?.length ?? 0}]`}
												>
													{(subField) => (
														<subField.ProfilePicker
															label="Search Profiles"
															field={subField}
															selectedProfileIds={field.state.value?.filter(
																isDefined,
															)}
														/>
													)}
												</form.AppField>

												{field.state.value?.map((_, i) => (
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
