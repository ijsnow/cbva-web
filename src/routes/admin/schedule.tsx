import { createFileRoute, redirect } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { viewerQueryOptions } from "@/auth/shared";
import {
	BulkEditSchedule,
	bulkEditScheduleSearchSchema,
} from "@/components/admin/schedule/bulk-edit";
import { tournamentsQueryOptions } from "@/functions/tournaments/get-tournaments";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/admin/schedule")({
	validateSearch: zodValidator(bulkEditScheduleSearchSchema),
	loaderDeps: ({ search }) => search,
	loader: async ({
		deps: { page, pageSize, divisions, venues, genders },
		context: { queryClient },
	}) => {
		const viewer = await queryClient.ensureQueryData(viewerQueryOptions());

		// Check if user is admin
		if (!viewer || viewer.role !== "admin") {
			throw redirect({ to: "/not-found" });
		}

		await queryClient.ensureQueryData(
			tournamentsQueryOptions({
				page,
				pageSize,
				divisions,
				venues,
				genders,
				past: false,
			}),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const params = Route.useSearch();

	return (
		<DefaultLayout classNames={{ content: "" }}>
			<BulkEditSchedule params={params} />
		</DefaultLayout>
	);
}
