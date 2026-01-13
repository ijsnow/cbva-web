import { createFileRoute } from "@tanstack/react-router";
import { title } from "@/components/base/primitives";
import { DefaultLayout } from "@/layouts/default";
import { ChangePasswordForm } from "@/components/users/change-password-form";
import { useViewer } from "@/auth/shared";

export const Route = createFileRoute("/account/change-password")({
	head: () => ({
		meta: [{ title: "Change Password" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const viewer = useViewer();

	return (
		<DefaultLayout>
			<div className="text-center flex flex-col space-y-6 max-w-xl mx-auto">
				<h1 className={title({ size: "lg" })}>Change Password</h1>
			</div>

			{viewer?.needsPasswordChange && (
				<p className="max-w-md mx-auto text-center">
					You were given a temporary password. You need to create a new one
					before using your account.
				</p>
			)}

			<ChangePasswordForm
				className="bg-white rounded-lg p-8 w-full max-w-sm mx-auto"
				isTemp={viewer?.needsPasswordChange}
			/>
		</DefaultLayout>
	);
}
