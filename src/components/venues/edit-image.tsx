import { EditIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components";
import { selectVenueSchema } from "@/db/schema";
import { Button } from "../base/button";
import { useAppForm } from "../base/form";
import { Modal, ModalHeading } from "../base/modal";
import { Uploader } from "../base/upload-image/uploader";

export function EditVenueImage({
	imageSource,
}: {
	imageSource: string | null;
}) {
	const schema = selectVenueSchema.pick({
		imageSource: true,
	});

	const form = useAppForm({
		defaultValues: {
			imageSource,
		},
		validators: {
			onMount: schema,
			onBlur: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { imageSource } }) => {
			console.log(imageSource);
		},
	});

	const [open, setOpen] = useState(false);

	return (
		<DialogTrigger isOpen={open} onOpenChange={setOpen}>
			<Button variant="icon" className="absolute top-3 right-3">
				<EditIcon />
			</Button>
			<Modal>
				<div className="p-3 flex flex-col space-y-8">
					<ModalHeading>Upload Image</ModalHeading>

					<Uploader />

					{/*<form className="flex flex-col space-y-3">
						<form.AppField name="imageSource">
							{(field) => <field.Image field={field} />}
						</form.AppField>

						<form.AppForm>
							<form.Footer className="col-span-full">
								<form.Button color="default" onClick={() => setOpen(false)}>
									Cancel
								</form.Button>

								<form.SubmitButton>Submit</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>*/}
				</div>
			</Modal>
		</DialogTrigger>
	);
}
