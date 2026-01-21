import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { getBlogsQueryOptions } from "@/functions/blogs/get-blogs";
import { deleteBlogMutationOptions } from "@/functions/blogs/delete-blog";

export function DeleteBlogForm({
	id,
	blogTitle,
	tag,
}: {
	id: number;
	blogTitle: string;
	tag: string;
}) {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: deleteBlog } = useMutation({
		...deleteBlogMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getBlogsQueryOptions(tag));
		},
	});

	const form = useAppForm({
		onSubmit: async ({ formApi }) => {
			await deleteBlog({ id });
			formApi.reset();
			setOpen(false);
		},
	});

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
			<Button variant="text" color="primary" tooltip="Delete Blog">
				<DeleteIcon size={16} />
			</Button>

			<Modal size="md" isDismissable isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-4 flex flex-col space-y-4">
					<Heading className={title({ size: "sm" })} slot="title">
						Delete Blog?
					</Heading>

					<p>Are you sure you want to delete this blog?</p>

					<p className="font-semibold italic">{blogTitle}</p>

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
