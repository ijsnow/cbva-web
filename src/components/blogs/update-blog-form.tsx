import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { getBlogsQueryOptions } from "@/functions/blogs/get-blogs";
import {
	updateBlogMutationOptions,
	updateBlogSchema,
} from "@/functions/blogs/update-blog";
import { LexicalState } from "@/db/schema/shared";

export function UpdateBlogForm({
	id,
	tag,
}: {
	id: number;
	tag: string;
}) {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: updateBlog } = useMutation({
		...updateBlogMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getBlogsQueryOptions(tag));
		},
	});

	const { data } = useQuery({
		...getBlogsQueryOptions(tag),
		select: (data) => data.find((v) => v.id === id),
	});

	const form = useAppForm({
		defaultValues: {
			imageSource: data?.imageSource ?? null,
			link: data?.link ?? "",
			title: data?.title ?? "",
			summary: data?.summary ?? ({ root: undefined } as unknown as LexicalState),
		},
		validators: {
			onMount: updateBlogSchema,
			onChange: updateBlogSchema,
		},
		onSubmit: async ({ value: { imageSource, link, title, summary }, formApi }) => {
			await updateBlog({ id, imageSource, link, title, summary });
			formApi.reset();
			setOpen(false);
		},
	});

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
			<Button variant="text" className="text-blue-500" tooltip="Edit Blog">
				<EditIcon size={16} />
			</Button>

			<Modal size="xl" isDismissable isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-4 flex flex-col space-y-4">
					<Heading className={title({ size: "sm" })} slot="title">
						Update Blog
					</Heading>

					<form
						className="flex-col space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.AppField name="title">
							{(field) => (
								<field.Text
									field={field}
									isRequired={true}
									label="Title"
									placeholder="Enter the title..."
								/>
							)}
						</form.AppField>

						<form.AppField name="link">
							{(field) => (
								<field.Text
									field={field}
									isRequired={true}
									label="Link"
									placeholder="Enter the link..."
								/>
							)}
						</form.AppField>

						<form.AppField name="imageSource">
							{(field) => (
								<field.ImageUpload
									field={field}
									isRequired={false}
									label="Image"
									bucket="blogs"
									prefix={tag}
								/>
							)}
						</form.AppField>

						<form.AppField name="summary">
							{(field) => (
								<field.RichText
									field={field}
									isRequired={true}
									label="Summary"
									placeholder="Enter the summary..."
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
