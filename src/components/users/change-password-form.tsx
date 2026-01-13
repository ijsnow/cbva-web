import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import z from "zod/v4";
import { Alert } from "@/components/base/alert";
import { useAppForm } from "@/components/base/form";
import { useLoggedInRedirect } from "@/hooks/auth";
import { changePasswordMutationOptions } from "@/functions/user/change-password";
import { Link } from "../base/link";

const schema = z
	.object({
		currentPassword: z.string(),
		newPassword: z
			.string()
			.min(8, { message: "Must be at least 8 characters" }),
		confirmNewPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: "Passwords don't match",
		path: ["confirmNewPassword"],
	});

export type ChangePasswordFormProps = {
	className?: string;
	isTemp?: boolean;
};

export function ChangePasswordForm({
	className,
	isTemp,
}: ChangePasswordFormProps) {
	const navigate = useNavigate();

	const { mutate, failureReason } = useMutation({
		...changePasswordMutationOptions(),
		onSuccess: () => {
			navigate({
				to: "/account",
			});
		},
	});

	useLoggedInRedirect("/account");

	const form = useAppForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmNewPassword: "",
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
			className={className}
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			<div className="flex flex-col gap-4 max-w-lg">
				{failureReason && (
					<Alert
						color="error"
						title="Uh oh!"
						description={failureReason.message}
					/>
				)}

				<form.AppField
					name="currentPassword"
					children={(field) => (
						<field.Password
							isRequired
							name="currentPassword"
							className="col-span-full"
							label={isTemp ? "Temporary Password" : "Current Password"}
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="newPassword"
					children={(field) => (
						<field.Password
							isRequired
							name="newPassword"
							className="col-span-full"
							label="New Password"
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="confirmNewPassword"
					children={(field) => (
						<field.Password
							isRequired
							name="confirmNewPassword"
							className="col-span-full"
							label="Confirm New Password"
							field={field}
						/>
					)}
				/>

				<form.AppForm>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
						children={([canSubmit, isSubmitting]) => (
							<form.Footer className="justify-stretch">
								<form.SubmitButton
									className="w-full"
									isDisabled={!canSubmit || isSubmitting}
								>
									Submit
								</form.SubmitButton>
							</form.Footer>
						)}
					/>
				</form.AppForm>

				{isTemp && (
					<Link to="/log-out" className="self-center text-xs text-gray-600">
						Log Out
					</Link>
				)}
			</div>
		</form>
	);
}
