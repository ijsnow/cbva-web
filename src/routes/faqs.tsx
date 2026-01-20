import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DeleteIcon, EditIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { createFaqSchema } from "@/db/schema";
import { createFaqMutationOptions } from "@/functions/faqs/create-faq";
import { DefaultLayout } from "@/layouts/default";
import { getFaqsQueryOptions } from "@/functions/faqs/get-faqs";
import {
	Disclosure,
	DisclosureGroup,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";
import { RichTextDisplay } from "@/components/base/rich-text-editor/display";
import { useViewerHasPermission } from "@/auth/shared";
import { deleteFaqMutationOptions } from "@/functions/faqs/delete-faq";
import {
	updateFaqMutationOptions,
	updateFaqSchema,
} from "@/functions/faqs/update-faq";
import { LexicalState } from "@/db/schema/shared";

export const Route = createFileRoute("/faqs")({
	loader: async ({ context: { queryClient } }) => {
		return await queryClient.ensureQueryData(getFaqsQueryOptions());
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data: faqs } = useSuspenseQuery(getFaqsQueryOptions());

	const canCreate = useViewerHasPermission({
		faqs: ["create"],
	});

	return (
		<DefaultLayout>
			<div className="max-w-4xl mx-auto py-8 px-4">
				<div className="flex justify-between items-center mb-12">
					<h1 className={title()}>Frequently Asked Questions</h1>

					{canCreate && <CreateFaqButton />}
				</div>

				{faqs && faqs.length === 0 && <p>No FAQs yet...</p>}

				{Boolean(faqs?.length) && (
					<DisclosureGroup>
						{faqs.map(({ id, question, answer }) => (
							<Disclosure key={id}>
								<DisclosureHeader
									color="alt"
									contentClassName="flex-1 flex flex-row justify-between items-center"
								>
									<span>{question}</span>

									<span className="flex flex-row space-x-2 items-center">
										<EditFaqButton id={id} />
										<DeleteFaqButton id={id} question={question} />
									</span>
								</DisclosureHeader>
								<DisclosurePanel color="alt">
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
				)}
			</div>
		</DefaultLayout>
	);
}

function CreateFaqButton() {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: createFaq } = useMutation({
		...createFaqMutationOptions(),
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
			await createFaq(value);
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

function EditFaqButton({ id }: { id: number }) {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: updateFaq } = useMutation({
		...updateFaqMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getFaqsQueryOptions());
		},
	});

	const { data } = useQuery({
		...getFaqsQueryOptions(),
		select: (data) => data.find((v) => v.id === id),
	});

	console.log("->", data);

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

function DeleteFaqButton({ id, question }: { id: number; question: string }) {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: deleteFaq } = useMutation({
		...deleteFaqMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getFaqsQueryOptions());
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
