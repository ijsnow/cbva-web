import { createFileRoute } from "@tanstack/react-router";
import { title } from "@/components/base/primitives";
import { ForgotPasswordForm } from "@/components/users/forgot-password-form";
import { ResetPasswordForm } from "@/components/users/reset-password-form";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/account/reset-password")({
	validateSearch: (
		search: Record<string, unknown>,
	): {
		token?: string;
	} => {
		return {
			token: search.token as string,
		};
	},
	head: () => ({
		meta: [{ title: "Reset Password" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { token } = Route.useSearch();

	return (
		<DefaultLayout>
			<div className="text-center flex flex-col space-y-6 max-w-xl mx-auto">
				<h1 className={title({ size: "lg" })}>Reset Password</h1>
			</div>

			<ResetPasswordForm
				className="bg-white rounded-lg p-8 w-full max-w-sm mx-auto"
				token={token}
			/>
		</DefaultLayout>
	);
}
