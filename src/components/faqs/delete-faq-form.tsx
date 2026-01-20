import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { getFaqsQueryOptions } from "@/functions/faqs/get-faqs";
import { deleteFaqMutationOptions } from "@/functions/faqs/delete-faq";

export function DeleteFaqForm({
	id,
	question,
	groupKey,
}: {
	id: number;
	question: string;
	groupKey?: string;
}) {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: deleteFaq } = useMutation({
		...deleteFaqMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getFaqsQueryOptions(groupKey));
		},
	});

	const form = useAppForm({
		onSubmit: async ({ formApi }) => {
			await deleteFaq({ id });
			formApi.reset();
			setOpen(false);
		},
	});

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
			<Button variant="text" color="primary" tooltip="Delete FAQ">
				<DeleteIcon size={16} />
			</Button>

			<Modal size="md" isDismissable isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-4 flex flex-col space-y-4">
					<Heading className={title({ size: "sm" })} slot="title">
						Delete FAQ?
					</Heading>

					<p>Are you sure you want to delete this FAQ?</p>

					<p className="font-semibold italic">{question}</p>

					<form
						className="flex-col space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.AppForm>
							<form.Footer>
								<Button onPress={() => setOpen(false)}>Cancel</Button>

								<form.SubmitButton requireChange={false}>
									Delete
								</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</DialogTrigger>
	);
}
