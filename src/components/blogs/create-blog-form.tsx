import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { createBlogSchema } from "@/db/schema";
import { createBlogMutationOptions } from "@/functions/blogs/create-blog";
import { getBlogsQueryOptions } from "@/functions/blogs/get-blogs";

export type CreateBlogFormProps = {
	tag: string;
};

export function CreateBlogForm({ tag }: CreateBlogFormProps) {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: createBlog } = useMutation({
		...createBlogMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getBlogsQueryOptions(tag));
		},
	});

	const schema = createBlogSchema.omit({ tag: true });

	const form = useAppForm({
		defaultValues: {
			imageSource: null as string | null,
			link: "",
			title: "",
			summary: "",
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: async ({ value, formApi }) => {
			await createBlog({ ...value, tag });
			formApi.reset();
			setOpen(false);
		},
	});

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
			<Button variant="icon" color="primary" tooltip="Add Blog">
				<PlusIcon size={16} />
			</Button>

			<Modal size="xl" isDismissable isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-4 flex flex-col space-y-4">
					<Heading className={title({ size: "sm" })} slot="title">
						Create Blog
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
									height="xs"
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
