import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListOrderedIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { getFaqsQueryOptions } from "@/functions/faqs/get-faqs";
import { OrderingList } from "@/components/base/ordering-list";
import { setFaqsOrderMutationOptions } from "@/functions/faqs/set-faqs-order";

export function ReorderFaqsForm({ groupKey }: { groupKey?: string }) {
	const [isOpen, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const { mutateAsync: setFaqOrder } = useMutation({
		...setFaqsOrderMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getFaqsQueryOptions());
		},
	});

	const { data: items } = useQuery({
		...getFaqsQueryOptions(groupKey),
		select: (data) =>
			data.map(({ id, question }) => ({ value: id, display: question })),
	});

	const form = useAppForm({
		defaultValues: {
			order: items?.map(({ value }) => value) ?? [],
		},
		onSubmit: async ({ value: { order }, formApi }) => {
			await setFaqOrder({ order, key: groupKey });
			formApi.reset();
			setOpen(false);
		},
	});

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
			<Button variant="icon" color="secondary" tooltip="Reorder FAQs">
				<ListOrderedIcon size={16} />
			</Button>

			<Modal size="md" isDismissable isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-4 flex flex-col space-y-4">
					<Heading className={title({ size: "sm" })} slot="title">
						Reorder FAQs?
					</Heading>

					<form
						className="flex-col space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.AppField name="order">
							{(field) => (
								<OrderingList
									items={items ?? []}
									onChange={(order) => field.handleChange(order)}
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
