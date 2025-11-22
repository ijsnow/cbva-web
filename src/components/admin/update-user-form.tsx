import {
	type QueryKey,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import type { Role } from "@/auth/permissions";
import { useAppForm } from "@/components/base/form";
import {
	adminUpdateUserMutationOptions,
	adminUpdateUserSchema,
} from "@/data/users";
import type { User } from "@/db/schema";

export type UpdateUserFormProps = Pick<User, "id" | "name" | "role"> & {
	refetch: () => void;
	queryKey: QueryKey;
};

export function UpdateUserForm({
	id,
	name,
	role,
	queryKey,
}: UpdateUserFormProps) {
	const queryClient = useQueryClient();

	const { mutate } = useMutation(adminUpdateUserMutationOptions());

	const schema = adminUpdateUserSchema.omit({
		id: true,
	});

	const form = useAppForm({
		defaultValues: {
			role,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { role }, formApi }) => {
			mutate(
				{
					id,
					role,
				},
				{
					onSuccess: () => {
						queryClient.setQueryData(queryKey, (data: { users: User[] }) => {
							return {
								...data,
								users: data.users.map((user) =>
									user.id === id
										? {
												...user,
												role,
											}
										: user,
								),
							};
						});

						formApi.reset();
					},
				},
			);
		},
	});

	return (
		<form
			className="bg-white rounded-lg px-2 py-2 border border-gray-700 grid grid-cols-10 gap-2"
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			<div className="col-span-8 flex flex-row items-center justify-between">
				<span>{name}</span>

				<form.AppForm>
					<form.Subscribe
						selector={(state) => [state.isDirty]}
						children={([isDirty]) =>
							isDirty ? <form.SubmitButton>Save</form.SubmitButton> : null
						}
					/>
				</form.AppForm>
			</div>

			<form.AppField
				name="role"
				children={(field) => (
					<field.Select
						className="col-span-2"
						field={field}
						options={[
							{
								display: "User",
								value: "user",
							},
							{
								display: "Director",
								value: "td",
							},
							{
								display: "Admin",
								value: "admin",
							},
						]}
					/>
				)}
			/>
		</form>
	);
}
