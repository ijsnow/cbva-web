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
	setMatchCourtMutationOptions,
	setMatchCourtSchema,
} from "@/functions/matches/set-match-court";
import { useTournamentDivisionName } from "@/hooks/tournament";
import { EditIcon } from "lucide-react";

export type SetCourtForm = {
	tournamentId: number;
	tournamentDivisionId: number;
	poolId?: number;
	playoffMatchId?: number;
	name: string;
	court?: string | null;
};

export function SetCourtForm({
	poolId,
	playoffMatchId,
	name,
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
		...setMatchCourtMutationOptions(),
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

	const schema = setMatchCourtSchema.pick({ court: true });

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
				poolId,
				playoffMatchId,
				court,
			});
		},
	});

	return (
		<>
			{court && (
				<span className="flex flex-row items-center gap-2">
					Court {court}
					{canUpdate && (
						<Button
							variant="text"
							className="text-blue-500"
							size="sm"
							onPress={() => setOpen(true)}
						>
							<EditIcon size={16} />
						</Button>
					)}
				</span>
			)}

			{!court && canUpdate && (
				<span className="flex flex-row items-center gap-2">
					Court{" "}
					<Button
						variant="text"
						className="text-blue-500"
						size="sm"
						onPress={() => setOpen(true)}
					>
						<EditIcon size={16} />
					</Button>
				</span>
			)}

			<Modal isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-3">
					<Heading className={title({ size: "sm" })} slot="title">
						Set Court
					</Heading>
					<p>
						Set <span className="font-semibold italic">{name}</span>
						{"'s "}
						court for the{" "}
						<span className="font-semibold italic">{divisionName}</span>{" "}
						division.
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
