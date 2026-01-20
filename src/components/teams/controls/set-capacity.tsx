import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditIcon } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { Dialog } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Popover } from "@/components/base/popover";
import { tournamentQueryOptions } from "@/data/tournaments";
import {
	setCapacityMutationOptions,
	setCapacitySchema,
} from "@/functions/tournament-divisions/set-capacity";
import type { Division, TournamentDivision } from "@/db/schema";
import { useTeamsQueryOptions } from "@/components/tournaments/context";

export type SetCapacityFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
};

export function SetCapacityForm({
	tournamentId,
	division,
}: SetCapacityFormProps) {
	const [isOpen, setOpen] = useState(false);
	const triggerRef = useRef(null);

	const queryClient = useQueryClient();

	const teamsQueryOptions = useTeamsQueryOptions();

	const { mutate, failureReason } = useMutation({
		...setCapacityMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(tournamentQueryOptions(tournamentId));
			queryClient.invalidateQueries(teamsQueryOptions);
		},
	});

	const schema = setCapacitySchema.pick({
		capacity: true,
		waitlistCapacity: true,
	});

	const form = useAppForm({
		defaultValues: {
			capacity: division.capacity,
			waitlistCapacity: division.waitlistCapacity,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { capacity, waitlistCapacity } }) => {
			mutate({
				id: division.id,
				capacity,
				waitlistCapacity,
			});

			setOpen(false);
		},
	});

	return (
		<>
			<Button variant="text" ref={triggerRef} onPress={() => setOpen(true)}>
				<span>Capacity: {division.capacity}</span>
				<span>Waitlist Capacity: {division.waitlistCapacity}</span>{" "}
				<EditIcon size={12} />
			</Button>
			<Popover triggerRef={triggerRef} isOpen={isOpen} onOpenChange={setOpen}>
				<Dialog aria-label="Set team and waitlist capacity">
					<form
						className="p-3 flex flex-col space-y-6"
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

						<form.AppField
							name="capacity"
							children={(field) => (
								<field.Number label="Capacity" field={field} minValue={1} />
							)}
						/>

						<form.AppField
							name="waitlistCapacity"
							children={(field) => (
								<field.Number
									label="Waitlist Capacity"
									field={field}
									minValue={0}
								/>
							)}
						/>

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
