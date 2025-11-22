import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod/v4";
import { authClient } from "@/auth/client";
import { useAppForm } from "@/components/base/form";
import { useLoggedInRedirect } from "@/hooks/auth";
import { Link } from "../base/link";

export type ForgotPasswordFormProps = {
	className?: string;
};

const schema = z.object({
	email: z.email(),
});

export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
	const [sentTo, setSentTo] = useState<string | undefined>();

	const { mutate: sendReset, failureReason } = useMutation({
		mutationFn: async ({ email }: z.infer<typeof schema>) => {
			if (sentTo === email) {
				return;
			}

			const { error } = await authClient.requestPasswordReset({
				email,
				redirectTo: "/account/reset-password",
			});

			if (error) {
				throw error;
			}
		},
		onSuccess: (_, { email }) => {
			setSentTo(email);
		},
	});

	useLoggedInRedirect("/account");

	const form = useAppForm({
		defaultValues: {
			email: "",
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value }) => {
			sendReset(value);
		},
	});

	return (
		<form
			className={className}
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			<div className="flex flex-col gap-4 max-w-lg">
				{failureReason && (
					<form.Alert
						color="error"
						title="Uh oh!"
						description={failureReason.message}
					/>
				)}

				<form.AppField
					name="email"
					children={(field) => (
						<field.Text
							isRequired
							label="Email"
							placeholder="Enter your email"
							type="email"
							field={field}
						/>
					)}
				/>

				<form.AppForm>
					<form.Subscribe
						selector={(state) => [
							state.canSubmit,
							state.isSubmitting,
							state.values.email,
						]}
						children={([canSubmit, isSubmitting, email]) => {
							if (email === sentTo) {
								return (
									<div className="space-y-3">
										<p>A confirmation email has been sent to:</p>
										<p className="border border-gray-500 rounded-md p-2 bg-gray-200 font-semibold">
											{form.state.values.email}
										</p>
										<p>
											Check your inbox for an email with a link to reset your
											password.
										</p>
									</div>
								);
							}

							return (
								<form.Footer>
									<form.SubmitButton
										className="w-full"
										isDisabled={Boolean(!canSubmit || isSubmitting)}
									>
										Send
									</form.SubmitButton>
								</form.Footer>
							);
						}}
					/>
				</form.AppForm>
			</div>
		</form>
	);
}
