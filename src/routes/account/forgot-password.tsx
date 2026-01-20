import { createFileRoute } from "@tanstack/react-router";
import { title } from "@/components/base/primitives";
import { ForgotPasswordForm } from "@/components/users/forgot-password-form";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/account/forgot-password")({
	head: () => ({
		meta: [{ title: "Forgot Password" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout>
			<div className="text-center flex flex-col space-y-6 max-w-xl mx-auto">
				<h1 className={title({ size: "lg" })}>Forgot your password?</h1>

				<p className="max-w-md mx-auto">
					Fill out the form below and we'll send you a link to reset your
					password.
				</p>
			</div>

			<ForgotPasswordForm className="bg-white rounded-lg p-8 w-full max-w-sm mx-auto" />
		</DefaultLayout>
	);
}
