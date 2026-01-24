import { createFileRoute, redirect } from "@tanstack/react-router";
import { ScheduleDashboard } from "@/components/admin/schedule";
import { UsersList } from "@/components/admin/users-list";
import { DefaultLayout } from "@/layouts/default";
import { AdminLayout } from "@/layouts/admin";

export const Route = createFileRoute("/admin/")({
	loader: async ({ context: { queryClient, ...context } }) => {
		const viewer = context.viewer;

		if (!viewer || viewer.role !== "admin") {
			throw redirect({ to: "/not-found" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	// return (
	// 	<DefaultLayout
	// 		classNames={{
	// 			content: "flex flex-col space-y-12 max-w-2xl px-3 py-12 mx-auto",
	// 		}}
	// 		sideNavItems={[
	// 			{
	// 				title: "Invoices",
	// 				to: "/admin/invoices" as const,
	// 			},
	// 		]}
	// 	>
	// 		<ScheduleDashboard />
	// 		<UsersList />
	// 	</DefaultLayout>
	// );

	return (
		<AdminLayout
			classNames={{
				content: "flex flex-col space-y-12 max-w-2xl px-3 py-12 mx-auto",
			}}
		>
			<ScheduleDashboard />
			<UsersList />
		</AdminLayout>
	);
}
