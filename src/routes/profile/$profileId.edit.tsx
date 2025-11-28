import { parseDate } from "@internationalized/date";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useViewerHasPermission } from "@/auth/shared";
import { title } from "@/components/base/primitives";
import { ProfileForm } from "@/components/users/profile-form";
import { profileQueryOptions } from "@/data/profiles";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/profile/$profileId/edit")({
	loader: async ({ params: { profileId }, context: { queryClient } }) => {
		const result = await queryClient.ensureQueryData(
			profileQueryOptions(Number.parseInt(profileId, 10)),
		);

		return result;
	},
	head: () => ({
		meta: [{ title: "Update Profile" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { profileId } = Route.useParams();

	const { data } = useSuspenseQuery({
		...profileQueryOptions(Number.parseInt(profileId, 10)),
		select: (data) => {
			return {
				...data,
				birthdate: parseDate(data.birthdate),
			};
		},
	});

	const canImpersonate = useViewerHasPermission({
		user: ["impersonate"],
	});

	console.log("canImpersonate", canImpersonate);

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 max-w-lg mx-auto flex flex-col space-y-16",
			}}
		>
			<h1 className={title({ className: "text-center" })}>Update Profile</h1>

			<div className="rounded-lg bg-white p-8 max-w-lg mx-auto">
				<Suspense fallback={<>Nope</>}>
					<ProfileForm initialValues={data ?? null} isEdit={true} />
				</Suspense>
			</div>
		</DefaultLayout>
	);
}
