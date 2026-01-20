import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { createFaqSchema, type Faq } from "@/db/schema";
import { createFaqMutationOptions } from "@/functions/faqs/create-faq";
import { getFaqsQueryOptions } from "@/functions/faqs/get-faqs";

export type CreateFaqFormProps = {
	groupKey?: Faq["key"];
};

export function CreateFaqForm({ groupKey }: CreateFaqFormProps) {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: createFaq } = useMutation({
		...createFaqMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getFaqsQueryOptions(groupKey));
		},
	});

	const form = useAppForm({
		defaultValues: {
			question: "",
			answer: "",
		},
		validators: {
			onMount: createFaqSchema,
			onChange: createFaqSchema,
		},
		onSubmit: async ({ value, formApi }) => {
			await createFaq({ ...value, key: groupKey });
			formApi.reset();
			setOpen(false);
		},
	});

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
			<Button variant="icon" color="primary" tooltip="Add FAQ">
				<PlusIcon size={16} />
			</Button>

			<Modal size="xl" isDismissable isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-4 flex flex-col space-y-4">
					<Heading className={title({ size: "sm" })} slot="title">
						Create FAQ
					</Heading>

					<form
						className="flex-col space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.AppField name="question">
							{(field) => (
								<field.Text
									field={field}
									isRequired={true}
									label="Question"
									placeholder="Enter the question..."
								/>
							)}
						</form.AppField>

						<form.AppField name="answer">
							{(field) => (
								<field.RichText
									field={field}
									isRequired={true}
									label="Answer"
									placeholder="Enter the answer..."
								/>
							)}
						</form.AppField>

						<form.AppForm>
							<form.Footer>
								<Button onPress={() => setOpen(false)}>Cancel</Button>

								<form.SubmitButton requireChange={false}>
									Create
								</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</DialogTrigger>
	);
}
