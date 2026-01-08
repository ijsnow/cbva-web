import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	usePools,
	usePoolsQueryOptions,
	useTeamsQueryOptions,
} from "@/components/tournaments/context";
import {
	updatePoolMutationOptions,
	updatePoolSchema,
} from "@/functions/teams/update-pool";
import { Button } from "@/components/base/button";
import { EditIcon } from "lucide-react";
import { useAppForm } from "@/components/base/form";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "react-aria-components";
import { Popover } from "@/components/base/popover";
import { Radio, RadioGroup } from "@/components/base/radio-group";
import { isNotNullOrUndefined } from "@/utils/types";
import type z from "zod";

export type EditPoolFormProps = {
	tournamentDivisionTeamId: number;
	poolId: number;
};

export function EditPoolForm({
	tournamentDivisionTeamId,
	poolId,
}: EditPoolFormProps) {
	const [isOpen, setOpen] = useState(false);
	const triggerRef = useRef(null);

	const [seedStrategy, setSeedStrategy] = useState("calculate");

	const teamsQueryOptions = useTeamsQueryOptions();
	const poolsQueryOptions = usePoolsQueryOptions();

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...updatePoolMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(teamsQueryOptions);
			queryClient.invalidateQueries(poolsQueryOptions);

			setOpen(false);
		},
	});

	const pools = usePools();

	const schema = updatePoolSchema.omit({ id: true });

	const form = useAppForm({
		defaultValues: {
			poolId,
			seed: null as number | null | undefined,
		} as z.infer<typeof schema>,
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { poolId, seed } }) => {
			mutate({
				id: tournamentDivisionTeamId,
				poolId,
				seed,
			});
		},
	});

	useEffect(() => {
		if (seedStrategy === "calculate") {
			form.setFieldValue("seed", null);
		} else {
			const selectedPool = pools.find(
				({ id }) => id === form.state.values.poolId,
			);

			form.setFieldValue(
				"seed",
				Math.max(
					0,
					...(selectedPool?.teams
						.map(({ seed }) => seed)
						.filter(isNotNullOrUndefined) ?? []),
				) + 1,
			);
		}
	}, [form, seedStrategy, pools]);

	return (
		<>
			<Button
				variant="icon"
				size="sm"
				ref={triggerRef}
				onPress={() => setOpen(true)}
			>
				<EditIcon />
			</Button>
			<Popover triggerRef={triggerRef} isOpen={isOpen} onOpenChange={setOpen}>
				<Dialog aria-label="Set team and waitlist capacity">
					<form
						className="p-3 flex flex-col space-y-4 min-w-xs"
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						{failureReason && (
							<form.AppForm>
								<form.Alert
									title={"Unable to update pool"}
									description={failureReason.message}
								/>
							</form.AppForm>
						)}

						<form.AppField name="poolId">
							{(field) => (
								<field.Select
									field={field}
									name="poolId"
									label="Desired Pool"
									options={pools.map(({ id, name }) => ({
										value: id,
										display: name.toUpperCase(),
									}))}
								/>
							)}
						</form.AppField>

						<RadioGroup
							orientation="vertical"
							label="Seed Strategy"
							value={seedStrategy}
							onChange={setSeedStrategy}
						>
							<Radio value="calculate">Recalculate</Radio>
							<Radio value="manual">Manual</Radio>
						</RadioGroup>

						{seedStrategy === "manual" && (
							<form.AppForm>
								<form.Subscribe
									selector={(state) =>
										pools.find((p) => p.id === state.values.poolId)
									}
								>
									{(pool) => (
										<form.AppField name="seed">
											{(field) => (
												<field.Number
													field={field}
													name="seed"
													label="Desired Seed"
													minValue={1}
													maxValue={pool ? pool.teams.length + 1 : undefined}
												/>
											)}
										</form.AppField>
									)}
								</form.Subscribe>
							</form.AppForm>
						)}

						<form.AppForm>
							<form.Footer>
								<form.SubmitButton>Save</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</Dialog>
			</Popover>
		</>
	);
}
