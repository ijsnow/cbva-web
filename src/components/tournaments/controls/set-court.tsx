import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heading } from "react-aria-components";
import { useViewerHasPermission } from "@/auth/shared";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { poolsQueryOptions } from "@/data/pools";
import {
	setPoolCourtMutationOptions,
	setPoolCourtSchema,
} from "@/functions/pools";
import { useTournamentDivisionName } from "@/hooks/tournament";

export type SetCourtForm = {
	tournamentId: number;
	tournamentDivisionId: number;
	poolId: number;
	poolName: string;
	court?: string | null;
};

export function SetCourtForm({
	poolId,
	poolName,
	court,
	tournamentId,
	tournamentDivisionId,
}: SetCourtForm) {
	const canUpdate = useViewerHasPermission({
		tournament: ["update"],
	});

	const [isOpen, setOpen] = useState(false);

	const divisionName = useTournamentDivisionName(
		tournamentId,
		tournamentDivisionId,
	);

	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		...setPoolCourtMutationOptions(),
		onSuccess: (_, { court }) => {
			setOpen(false);

			queryClient.setQueryData(
				poolsQueryOptions({
					tournamentDivisionId,
				}).queryKey,
				(data) => {
					return data?.map((pool) => {
						if (pool.id !== poolId) {
							return pool;
						}

						return {
							...pool,
							court,
						};
					});
				},
			);

			queryClient.invalidateQueries({
				queryKey: poolsQueryOptions({
					tournamentDivisionId,
				}).queryKey,
			});
		},
	});

	const schema = setPoolCourtSchema.omit({ id: true });

	const form = useAppForm({
		defaultValues: {
			court: "",
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { court } }) => {
			mutate({
				id: poolId,
				court,
			});
		},
	});

	return (
		<>
			{court && <span>Court {court}</span>}

			{!court && canUpdate && (
				<Button onPress={() => setOpen(true)}>Set Court</Button>
			)}

			<Modal isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-3">
					<Heading className={title({ size: "sm" })} slot="title">
						Set Court
					</Heading>
					<p>
						Set{" "}
						<span className="font-semibold italic uppercase">
							Pool {poolName}
						</span>
						{"'s "}
						court for the division{" "}
						<span className="font-semibold italic uppercase">
							{divisionName}
						</span>
						.
					</p>
					<form
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						<form.AppField
							name="court"
							children={(field) => (
								<field.Text
									isRequired
									className="col-span-3"
									label="Court"
									field={field}
								/>
							)}
						/>

						<form.AppForm>
							<form.Footer className="col-span-full">
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
