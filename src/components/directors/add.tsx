import { useQuery } from "@tanstack/react-query";
import { EditIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import z from "zod";
import {
	directorsQueryOptions,
	useInsertTournamentDirector,
} from "@/data/directors";
import { Button, type ButtonProps } from "../base/button";
import { useAppForm } from "../base/form";
import { Modal } from "../base/modal";
import { title } from "../base/primitives";

export type DirectorsModalProps = {
	triggerProps?: ButtonProps;
	tournamentId: number;
	existingDirectorIds: number[];
};

const schema = z.object({
	directorId: z.number(),
});

export function AddDirector({
	triggerProps = {
		variant: "icon",
		color: "alternate",
		radius: "full",
		className: "text-blue-500",
		children: <EditIcon size={16} />,
	},
	tournamentId,
	existingDirectorIds,
}: DirectorsModalProps) {
	const [isOpen, setOpen] = useState(false);

	const { mutate: insertTournamentDirector, failureReason } =
		useInsertTournamentDirector();

	const { data: options } = useQuery({
		...directorsQueryOptions(),
		select: (data) =>
			data.map((d) => ({
				value: d.id,
				display: `${d.profile.preferredName} ${d.profile.lastName}`,
				additionalText: "ope",
			})),
	});

	const form = useAppForm({
		defaultValues: {
			directorId: null as unknown as number,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value, formApi }) => {
			insertTournamentDirector(
				{
					tournamentId,
					directorId: value.directorId,
				},
				{
					onSuccess: () => {
						setOpen(false);

						formApi.reset();
					},
				},
			);
		},
	});

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
			<Button {...triggerProps} />

			<Modal isDismissable isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-4 relative">
					<Heading
						className={title({
							size: "sm",
							class: "flex flex-row justify-between items-center",
						})}
						slot="title"
					>
						<span>Add Director</span>

						<Button variant="icon" slot="close">
							<XIcon size={16} />
						</Button>
					</Heading>

					<form
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						{failureReason && (
							<form.AppForm>
								<form.Alert
									title="Uh oh!"
									description={failureReason.message}
								/>
							</form.AppForm>
						)}

						<form.AppField
							name="directorId"
							children={(field) => (
								<field.ComboBox
									isRequired
									className="col-span-full"
									label="Director to Add"
									field={field}
									options={
										options?.filter(
											(v) => !existingDirectorIds.includes(v.value),
										) || []
									}
									autoFocus={true}
									disabledKeys={existingDirectorIds}
								/>
							)}
						/>

						<form.AppForm>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
								children={([canSubmit, isSubmitting]) => (
									<form.Footer className="justify-stretch">
										<form.SubmitButton
											className="w-full"
											isDisabled={!canSubmit || isSubmitting}
										>
											Submit
										</form.SubmitButton>
									</form.Footer>
								)}
							/>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</DialogTrigger>
	);
}
