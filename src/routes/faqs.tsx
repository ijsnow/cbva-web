import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { createFaqSchema } from "@/db/schema";
import { createFaqFn } from "@/functions/faqs/create-faq";
import { DefaultLayout } from "@/layouts/default";
import { RichTextEditor } from "@/components/base/rich-text-editor/editor";
import { Label } from "@/components/base/field";

export const Route = createFileRoute("/faqs")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout>
			<div className="max-w-4xl mx-auto py-8 px-4">
				<div className="flex justify-between items-center mb-6">
					<h1 className={title()}>FAQs</h1>
					<CreateFaqButton />
				</div>
			</div>
		</DefaultLayout>
	);
}

function CreateFaqButton() {
	const [isOpen, setOpen] = useState(false);

	const { mutateAsync: createFaq } = useMutation({
		mutationFn: createFaqFn,
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
			await createFaq({ data: value });
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
									label="Question"
									placeholder="Enter the question..."
								/>
							)}
						</form.AppField>

						<div>
							<Label>Answer</Label>

							<form.AppField name="answer">
								{(field) => (
									<RichTextEditor
										name="createFaq"
										placeholder="Enter the answer..."
										initialValue={field.state.value}
										onChange={(state) => {
											console.log("cancel");
										}}
									/>
								)}
							</form.AppField>
						</div>

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
