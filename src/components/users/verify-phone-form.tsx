import { useMutation } from "@tanstack/react-query";
import z from "zod";
import { authClient } from "@/auth/client";
import { useAppForm } from "../base/form";

const schema = z.object({
	code: z.string(),
});

export function VerifyPhoneForm({ phoneNumber }: { phoneNumber: string }) {
	const { mutate } = useMutation({
		mutationFn: async ({ code }: z.infer<typeof schema>) => {
			await authClient.phoneNumber.verify({
				phoneNumber,
				code,
			});
		},
	});

	const form = useAppForm({
		defaultValues: {
			code: "",
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value }) => {
			mutate(value);
		},
	});

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();

				form.handleSubmit();
			}}
		>
			<form.AppField
				name="code"
				children={(field) => (
					<field.Text
						isRequired
						className="col-span-full"
						label="Code"
						field={field}
					/>
				)}
			/>

			<form.AppForm>
				<form.Footer className="col-span-full">
					<form.SubmitButton>Submit</form.SubmitButton>
				</form.Footer>
			</form.AppForm>
		</form>
	);
}
