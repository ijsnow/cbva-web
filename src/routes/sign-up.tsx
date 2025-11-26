import { createFileRoute, Link } from "@tanstack/react-router";

import { title } from "@/components/base/primitives";
import { RegisterUserForm } from "@/components/users/register-user-form";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/sign-up")({
	head: () => ({
		meta: [
			{
				title: "CBVA Sign Up",
			},
		],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout>
			<div className="text-center flex flex-col space-y-6 max-w-xl mx-auto">
				<h1 className={title({ size: "lg" })}>
					Sign Up to Become a CBVA Member
				</h1>

				<p>
					Already have an account?{" "}
					<Link to="/log-in" className="underline hover:no-underline">
						Log in
					</Link>
				</p>
			</div>

			<RegisterUserForm className="bg-white rounded-lg p-8 w-full max-w-md mx-auto" />
		</DefaultLayout>
	);
}
