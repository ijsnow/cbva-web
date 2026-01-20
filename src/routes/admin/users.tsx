import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useDebounce } from "ahooks";
import { Suspense, useState } from "react";
import { Header } from "react-aria-components";
import type { Role } from "@/auth/permissions";
import { viewerQueryOptions } from "@/auth/shared";
import { ScheduleDashboard } from "@/components/admin/schedule";
import { UpdateUserForm } from "@/components/admin/update-user-form";
import { UsersList } from "@/components/admin/users-list";
import { title } from "@/components/base/primitives";
import { SearchField } from "@/components/base/search-field";
import { usersQueryOptions } from "@/data/users";
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
	return (
		<DefaultLayout
			classNames={{
				content: "max-w-2xl px-4 py-16 mx-auto flex flex-col space-y-8",
			}}
		>
			<UsersList />
		</DefaultLayout>
	);
}
