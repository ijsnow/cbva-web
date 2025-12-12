import { createFileRoute, redirect } from "@tanstack/react-router";
import { authMiddleware } from "@/auth/shared";
import { ScheduleDashboard } from "@/components/admin/schedule";
import { UsersList } from "@/components/admin/users-list";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/admin/")({
	loader: async ({ context: { queryClient, ...context }, serverContext }) => {
		const viewer = context.viewer;

		// Check if user is admin
		if (!viewer || viewer.role !== "admin") {
			throw redirect({ to: "/not-found" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout
			classNames={{
				content: "flex flex-col space-y-12 max-w-2xl px-3 py-12 mx-auto",
			}}
		>
			<ScheduleDashboard />
			<UsersList />
		</DefaultLayout>
	);
}
