import { DeleteIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { useDeleteTournamentDirector } from "@/data/directors";
import { Button } from "../base/button";
import { useAppForm } from "../base/form";
import { Modal } from "../base/modal";
import { title } from "../base/primitives";

export type DirectorsModalProps = {
	id: number;
	name: string;
	tournamentId: number;
	isDisabled: boolean;
};

export function RemoveDirector({
	id,
	name,
	tournamentId,
	isDisabled,
}: DirectorsModalProps) {
	const [isOpen, setOpen] = useState(false);

	const { mutate: removeTournamentDirector, failureReason } =
		useDeleteTournamentDirector();

	const form = useAppForm({
		onSubmit: () => {
			removeTournamentDirector(
				{
					id,
					tournamentId,
				},
				{
					onSuccess: () => {
						setOpen(false);
					},
				},
			);
		},
	});

	return (
		<DialogTrigger isOpen={isDisabled ? false : isOpen} onOpenChange={setOpen}>
			<Button
				variant="icon"
				color="alternate"
				radius="full"
				className="absolute float-right right-0 text-red-500"
				isDisabled={isDisabled}
			>
				<DeleteIcon size={16} />
			</Button>
			<Modal
				isDismissable
				isOpen={isDisabled ? false : isOpen}
				onOpenChange={setOpen}
			>
				<div className="p-4 flex flex-col space-y-4 relative">
					<Heading
						className={title({
							size: "sm",
							class: "flex flex-row justify-between items-center",
						})}
						slot="title"
					>
						<span>Remove Director</span>

						<Button variant="icon" className="fill-red-500" slot="close">
							<XIcon size={16} />
						</Button>
					</Heading>

					<p>
						Are you sure you'd like to remove{" "}
						<span className="font-semibold">{name}</span> from the list of
						directors for this tournament?
					</p>

					<form
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						{failureReason && (
							<form.AppForm>
								<form.Alert title="Oops!" description={failureReason.message} />
							</form.AppForm>
						)}

						<form.AppForm>
							<form.Footer className="justify-end">
								<Button onPress={() => setOpen(false)}>Cancel</Button>
								<form.SubmitButton requireChange={false}>
									Confirm
								</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</DialogTrigger>
	);
}
