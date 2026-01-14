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
import { isDefined } from "@/utils/types";
import type z from "zod";
import { usePlayoffsQueryOptions, usePoolsQueryOptions } from "../context";

// TODO: confirm works with pools and playoffs

export type SetCourtForm = {
	tournamentId: number;
	tournamentDivisionId: number;
	poolId?: number;
	playoffMatchId?: number;
	name: string;
	court: string | null | undefined;
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
	const poolsQueryOptions = usePoolsQueryOptions();
	const playoffsQueryOptions = usePlayoffsQueryOptions();

	const { mutate } = useMutation({
		...setMatchCourtMutationOptions(),
		onSuccess: (_) => {
			setOpen(false);

			if (poolId) {
				queryClient.invalidateQueries(poolsQueryOptions);
			} else {
				queryClient.invalidateQueries(playoffsQueryOptions);
			}
		},
	});

	const schema = setMatchCourtSchema.pick({
		court: true,
	});

	const form = useAppForm({
		defaultValues: {
			court: court ?? "Court ",
		} as z.infer<typeof setMatchCourtSchema>,
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
					{court}
					{canUpdate && (
						<Button
							variant="text"
							className="text-blue-500"
							size="sm"
							onPress={() => setOpen(true)}
							tooltip="Set or update court"
						>
							<EditIcon size={16} />
						</Button>
					)}
				</span>
			)}

			{!court && canUpdate && (
				<Button
					className="text-blue-500"
					size="sm"
					onPress={() => setOpen(true)}
					tooltip="Set or update court"
					variant="link"
				>
					Set Court <EditIcon size={12} />
				</Button>
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
						className="flex flex-col space-y-2"
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						<form.AppField
							name="court"
							children={(field) => (
								<field.Text isRequired label="Court" field={field} />
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
