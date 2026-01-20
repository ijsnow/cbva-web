import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DeleteIcon, EditIcon, ListOrderedIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { getFaqsQueryOptions } from "@/functions/faqs/get-faqs";
import {
	updateFaqMutationOptions,
	updateFaqSchema,
} from "@/functions/faqs/update-faq";
import { LexicalState } from "@/db/schema/shared";

export function UpdateFaqForm({
	id,
	groupKey,
}: {
	id: number;
	groupKey: string;
}) {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: updateFaq } = useMutation({
		...updateFaqMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getFaqsQueryOptions(groupKey));
		},
	});

	const { data } = useQuery({
		...getFaqsQueryOptions(groupKey),
		select: (data) => data.find((v) => v.id === id),
	});

	const form = useAppForm({
		defaultValues: {
			question: data?.question ?? "",
			answer: data?.answer ?? ({ root: undefined } as unknown as LexicalState),
		},
		validators: {
			onMount: updateFaqSchema,
			onChange: updateFaqSchema,
		},
		onSubmit: async ({ value: { question, answer }, formApi }) => {
			await updateFaq({ id, question, answer });
			formApi.reset();
			setOpen(false);
		},
	});

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
			<Button variant="text" className="text-blue-500" tooltip="Add FAQ">
				<EditIcon size={16} />
			</Button>

			<Modal size="xl" isDismissable isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-4 flex flex-col space-y-4">
					<Heading className={title({ size: "sm" })} slot="title">
						Update FAQ
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
									Submit
								</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</DialogTrigger>
	);
}
