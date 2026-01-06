import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { editSeedMutationOptions } from "@/functions/teams/edit-seed";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, EditIcon, XIcon } from "lucide-react";
import { useState } from "react";

export type EditSeedFormProps = {
	tournamentDivisionTeamId: number;
	seed: number;
};

export function EditSeedForm({
	tournamentDivisionTeamId,
	seed,
}: EditSeedFormProps) {
	const [showForm, setShowForm] = useState(false);

	const { mutate } = useMutation({
		...editSeedMutationOptions(),
	});

	const form = useAppForm({
		defaultValues: {
			seed,
		},
		validators: {
			// ...
		},
		onSubmit: ({ value: { seed } }) => {
			mutate({
				id: tournamentDivisionTeamId,
				seed,
			});
		},
	});

	if (!showForm) {
		return (
			<Button variant="icon" size="sm" onPress={() => setShowForm(true)}>
				<EditIcon />
			</Button>
		);
	}

	return (
		<form
			className="flex flex-row gap-2 max-w-18"
			onSubmit={(event) => {
				event.preventDefault();

				form.handleSubmit();
			}}
		>
			<form.AppField name="seed">
				{(field) => <field.Number field={field} name="seed" />}
			</form.AppField>
			<form.AppForm>
				<Button variant="icon" onPress={() => setShowForm(false)}>
					<XIcon size={16} />
				</Button>
				<form.SubmitButton variant="icon">
					<CheckIcon />
				</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}
