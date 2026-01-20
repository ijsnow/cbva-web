import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
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
import { getFaqsQueryOptions } from "@/functions/faqs/get-faqs";
import {
	Disclosure,
	DisclosureGroup,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";
import { RichTextDisplay } from "@/components/base/rich-text-editor/display";

export const Route = createFileRoute("/faqs")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: faqs } = useSuspenseQuery(getFaqsQueryOptions());

	return (
		<DefaultLayout>
			<div className="max-w-4xl mx-auto py-8 px-4">
				<div className="flex justify-between items-center mb-6">
					<h1 className={title()}>FAQs</h1>

					<CreateFaqButton />
				</div>

				<DisclosureGroup>
					{faqs.map(({ id, question, answer }) => (
						<Disclosure key={id}>
							<DisclosureHeader color="alt">{question}</DisclosureHeader>
							<DisclosurePanel>
								<RichTextDisplay
									name="faq-answer"
									content={
										typeof answer === "string" ? JSON.parse(answer) : answer
									}
								/>
							</DisclosurePanel>
						</Disclosure>
					))}
				</DisclosureGroup>
			</div>
		</DefaultLayout>
	);
}

function CreateFaqButton() {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: createFaq } = useMutation({
		mutationFn: createFaqFn,
		onSuccess: () => {
			queryClient.invalidateQueries(getFaqsQueryOptions());
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
