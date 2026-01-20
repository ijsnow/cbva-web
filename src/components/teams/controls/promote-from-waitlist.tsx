import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import {
	promoteFromWaitlistMutationOptions,
	promoteFromWaitlistSchema,
} from "@/functions/teams/promote-from-waitlist";
import {
	usePlayoffsQueryOptions,
	usePoolsQueryOptions,
	useTeamsQueryOptions,
	useLastSeed,
} from "@/components/tournaments/context";
import type z from "zod";
import { isDefined } from "@/utils/types";
import { orderBy } from "lodash-es";

export type PromoteFromWaitlistFormProps = {
	tournamentDivisionTeamId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function PromoteFromWaitlistForm({
	tournamentDivisionTeamId,
	...props
}: PromoteFromWaitlistFormProps) {
	const queryClient = useQueryClient();

	const teamsQueryOptions = useTeamsQueryOptions();

	const { data: teams } = useQuery(teamsQueryOptions);

	const hasSeeds = teams?.some((team) => isDefined(team.seed));

	const lastSeed = useLastSeed();

	const poolsQueryOptions = usePoolsQueryOptions();

	const { data: pools } = useQuery(poolsQueryOptions);

	const hasPoolSeeds = pools?.some((pool) =>
		pool.teams.some((team) => isDefined(team.seed)),
	);

	const poolsSmallestToLargest = orderBy(
		pools,
		[(pool) => pool.teams.length],
		["asc"],
	);

	const poolOptions = poolsSmallestToLargest?.map((pool) => ({
		value: pool.id,
		display: pool.name.toUpperCase(),
		afterDisplay: `${pool.teams.length} teams`,
	}));

	const defaultPoolId = poolOptions.length ? poolOptions[0].value : null;

	const playoffsQueryOptions = usePlayoffsQueryOptions();

	const { mutate, failureReason } = useMutation({
		...promoteFromWaitlistMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(teamsQueryOptions);
			queryClient.invalidateQueries(poolsQueryOptions);
			queryClient.invalidateQueries(playoffsQueryOptions);

			props.onOpenChange(false);
		},
	});

	const schema = promoteFromWaitlistSchema.omit({ id: true });

	const defaultValues = {
		seed: hasSeeds ? lastSeed + 1 : null,
		poolId: defaultPoolId,
		poolSeed: null,
		automatic: false,
	} as z.infer<typeof schema>;

	const form = useAppForm({
		defaultValues,
		validators: {
			onMount: schema,
			onChange: schema,
		},
		listeners: {
			onChange: ({ formApi, fieldApi }) => {
				if (fieldApi.name === "automatic") {
					if (fieldApi.state.value) {
						formApi.setFieldValue("seed", null);
						formApi.setFieldValue("poolId", null);
						formApi.setFieldValue("poolSeed", null);
					} else {
						formApi.reset(defaultValues);
					}
				}
			},
		},
		onSubmit: ({ value: { automatic, seed, poolId, poolSeed } }) => {
			mutate({
				id: tournamentDivisionTeamId,
				seed,
				poolId,
				poolSeed,
				automatic,
			});
		},
	});

	return (
		<Modal {...props}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Promote Team from Waitlist
				</Heading>

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
								title={"Unable to mark abandoned ref"}
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppField name="automatic">
						{(field) => (
							<field.Checkbox
								field={field}
								label="Recalculate seeds and pools for whole division"
							/>
						)}
					</form.AppField>

					<form.Subscribe selector={(state) => state.values.automatic}>
						{(automatic) => (
							<>
								{hasSeeds && (
									<form.AppField name="seed">
										{(field) => (
											<field.Number
												isDisabled={automatic}
												label="Seed"
												field={field}
												minValue={1}
												maxValue={lastSeed + 1}
											/>
										)}
									</form.AppField>
								)}

								{poolOptions.length > 0 && (
									<form.AppField name="poolId">
										{(field) => (
											<field.Select
												isDisabled={automatic}
												label="Pool"
												options={poolOptions ?? []}
												field={field}
											/>
										)}
									</form.AppField>
								)}

								{poolOptions && hasPoolSeeds && (
									<form.AppField name="poolSeed">
										{(field) => (
											<field.Number
												isDisabled={automatic}
												label="Pool Seed"
												field={field}
												minValue={1}
											/>
										)}
									</form.AppField>
								)}
							</>
						)}
					</form.Subscribe>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => props.onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton requireChange={false}>
								Submit
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
