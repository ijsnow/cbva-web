import {
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useDebounce } from "ahooks";
import { Suspense, useState } from "react";
import { Header } from "react-aria-components";
import { useAsyncList } from "react-stately";
import type { Role } from "@/auth/permissions";
import { viewerQueryOptions } from "@/auth/shared";
import { UpdateUserForm } from "@/components/admin/update-user-form";
import { title } from "@/components/base/primitives";
import { SearchField } from "@/components/base/search-field";
import { usersQueryOptions } from "@/data/users";
import type { User } from "@/db/schema";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/admin/users")({
	loader: async ({ context: { queryClient } }) => {
		const viewer = await queryClient.ensureQueryData(viewerQueryOptions());

		// Check if user is admin
		if (!viewer || viewer.role !== "admin") {
			throw redirect({ to: "/not-found" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();

	const list = useAsyncList<User>({
		load: async ({ filterText }) => {
			if (!filterText || filterText?.length < 3) {
				return {
					items: [],
				};
			}

			const result = await queryClient.ensureQueryData(
				usersQueryOptions({ name: filterText }),
			);

			return {
				items: result.users,
			};
		},
	});

	const [name, setName] = useState("");

	const debouncedName = useDebounce(name, {
		wait: name.length <= 3 ? 0 : 750,
	});

	const searchOptions = usersQueryOptions({ name: debouncedName });

	const { data, refetch, isLoading } = useQuery({
		...searchOptions,
		enabled: debouncedName.length >= 3,
	});

	return (
		<DefaultLayout
			classNames={{
				content: "max-w-2xl px-4 py-16 mx-auto flex flex-col space-y-8",
			}}
		>
			<Header className={title()}>Users</Header>

			<SearchField
				autoFocus={true}
				value={name}
				onChange={(value) => setName(value)}
			/>

			<Suspense>
				<div className="flex flex-col items-stretch space-y-2">
					<div className="grid grid-cols-10 gap-2 px-2">
						<span className="col-span-8">Name</span>
						<span className="col-span-2">Role</span>
					</div>

					{data?.users.map(({ id, name, role }) => (
						<UpdateUserForm
							key={id}
							id={id}
							name={name}
							role={role as Role}
							queryKey={searchOptions.queryKey}
							refetch={() => {
								console.log("refetch");
								refetch();
							}}
						/>
					))}

					{(!data || data?.users.length === 0) && (
						<div className="bg-white rounded-lg px-2 py-2 border border-gray-700">
							{isLoading
								? "Loading..."
								: "Nothing to show. Start typing to see results."}
						</div>
					)}
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
