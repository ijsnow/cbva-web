import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "ahooks";
import { Suspense, useState } from "react";
import { Header } from "react-aria-components";
import { SearchField } from "@/components/base/search-field";
import { card, title } from "../base/primitives";
import { getProfilesQueryOptions } from "@/functions/profiles/get-profiles";
import { ProfileName } from "./name";
import { Link } from "../base/link";
import { getLevelDisplay } from "@/hooks/tournament";

export function ProfileSearch() {
	const [query, setQuery] = useState("");

	const debouncedQuery = useDebounce(query, {
		wait: query.length <= 3 ? 0 : 750,
	});

	const searchOptions = getProfilesQueryOptions({ query: debouncedQuery });

	const { data, isLoading } = useQuery({
		...searchOptions,
		enabled: debouncedQuery.length >= 3,
	});

	const profiles = useDebounce(data, {
		wait: data?.length === 0 ? 0 : 250,
	});

	return (
		<section className="flex flex-col space-y-8">
			<Header className={title({ size: "sm" })}>Search Players</Header>

			<SearchField value={query} onChange={(value) => setQuery(value)} />

			<Suspense>
				<div className="flex flex-col items-stretch space-y-2">
					{profiles?.map((profile) => (
						<Link
							key={profile.id}
							variant="alt"
							to="/profile/$profileId"
							params={{ profileId: profile.id.toString() }}
							className={card({
								size: "sm",
								className:
									"py-2 px-4 flex flex-row justify-between items-center",
							})}
						>
							<ProfileName {...profile} link={false} />

							<span>{getLevelDisplay(profile.level, 0)}</span>
						</Link>
					))}

					{(!profiles || profiles?.length === 0) && (
						<div>{isLoading ? "Loading..." : null}</div>
					)}
				</div>
			</Suspense>
		</section>
	);
}
