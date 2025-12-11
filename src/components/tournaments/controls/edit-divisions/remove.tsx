import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { EditIcon, XIcon } from "lucide-react";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { divisionsQueryOptions } from "@/data/divisions";
import { tournamentQueryOptions } from "@/data/tournaments";
import {
	removeTournamentDivisionMutationOptions,
	removeTournamentDivisionSchema,
} from "@/data/tournaments/divisions";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
// import { teamsQueryOptions } from "@/data/teams";
// import {
// 	editDivisionsMutationOptions,
// 	editDivisionsSchema,
// } from "@/data/tournaments/teams";
import { isNotNullOrUndefined } from "@/utils/types";

export type RemoveDivisionFormProps = {
	tournamentId: number;
	divisionId: number;
	isDisabled?: boolean;
};

export function RemoveDivisionForm({
	tournamentId,
	divisionId,
	isDisabled,
}: RemoveDivisionFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...removeTournamentDivisionMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(tournamentQueryOptions(tournamentId));
		},
	});

	const form = useAppForm({
		defaultValues: {
			id: divisionId,
		},
		validators: {
			onMount: removeTournamentDivisionSchema,
			onChange: removeTournamentDivisionSchema,
		},
		onSubmit: ({ value: { id } }) => {
			if (!isDisabled) {
				mutate({
					id,
				});
			}
		},
	});

	return (
		<form
			className="flex flex-col space-y-3"
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			<form.AppForm>
				<form.ConfirmSubmitButton
					isDisabled={isDisabled}
					size="sm"
					description="Removing a division will delete any data related to this division such as teams and matches."
				>
					<XIcon size={12} /> Remove
				</form.ConfirmSubmitButton>
			</form.AppForm>
		</form>
	);
}
