import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "ahooks";
import { Suspense, useEffect, useState } from "react";
import { Header } from "react-aria-components";
import type { Role } from "@/auth/permissions";
import { UpdateUserForm } from "@/components/admin/update-user-form";
import { SearchField } from "@/components/base/search-field";
import { usersQueryOptions } from "@/data/users";
import { title } from "../base/primitives";

export function UsersList() {
	const [name, setName] = useState("");

	const debouncedName = useDebounce(name, {
		wait: name.length <= 3 ? 0 : 750,
	});

	const searchOptions = usersQueryOptions({ name: debouncedName });

	const { data, refetch, isLoading } = useQuery({
		...searchOptions,
		enabled: debouncedName.length >= 3,
	});

	const users = useDebounce(data?.users, {
		wait: data?.users.length === 0 ? 0 : 250,
	});

	return (
		<section className="flex flex-col space-y-8">
			<Header className={title({ size: "sm" })}>Users</Header>

			<SearchField value={name} onChange={(value) => setName(value)} />

			<Suspense>
				<div className="flex flex-col items-stretch space-y-2">
					<div className="grid grid-cols-10 gap-2 px-2">
						<span className="col-span-8">Name</span>
						<span className="col-span-2">Role</span>
					</div>

					{users?.map(({ id, name, role }) => (
						<UpdateUserForm
							key={id}
							id={id}
							name={name}
							role={role as Role}
							queryKey={searchOptions.queryKey}
							refetch={() => {
								refetch();
							}}
						/>
					))}

					{(!users || users?.length === 0) && (
						<div className="bg-white rounded-lg px-2 py-2 border border-gray-700">
							{isLoading
								? "Loading..."
								: "Nothing to show. Start typing to see results."}
						</div>
					)}
				</div>
			</Suspense>
		</section>
	);
}
