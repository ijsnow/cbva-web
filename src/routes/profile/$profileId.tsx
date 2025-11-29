import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { round } from "lodash-es";
import { CircleCheckIcon } from "lucide-react";
import { Suspense } from "react";
import { pill, title } from "@/components/base/primitives";
import { ImpersonateButton } from "@/components/impersonator/impersonate-button";
import { ProfileName } from "@/components/profiles/name";
import { ProfilePhoto } from "@/components/profiles/photo";
import {
	profileOverviewQueryOptions,
	profileResultsQueryOptions,
} from "@/data/profiles";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/profile/$profileId")({
	loader: async ({ params: { profileId }, context: { queryClient } }) => {
		const result = await queryClient.ensureQueryData(
			profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
		);

		return result;
	},
	head: () => ({
		meta: [{ title: "Player Profile" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { profileId } = Route.useParams();

	const { data: profile } = useSuspenseQuery({
		...profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
	});

	const { data: results } = useSuspenseQuery({
		...profileResultsQueryOptions(Number.parseInt(profileId, 10)),
	});

	console.log("->", results);

	const accolades = [
		{
			label: "Rating",
			value: profile?.level?.name,
		},
		{
			label: "Rank",
			value: profile?.rank,
		},
		{
			label: "Points",
			value: round(profile?.ratedPoints),
		},
		{
			label: "Junior Points",
			value: round(profile?.juniorsPoints),
		},
	];

	return (
		<DefaultLayout
			classNames={{
				content: "pt-12 w-full relative bg-white",
			}}
		>
			<ImpersonateButton userId={profile?.userId} />

			<Suspense fallback={<>Nope</>}>
				<div className="px-4 max-w-5xl mx-auto flex flex-row space-x-8">
					<div>
						<ProfilePhoto {...profile} className="w-48 h-48" />
					</div>

					<div className="flex flex-col space-y-4 w-full items-start sm:items-stretch">
						<div className="py-2 flex flex-row space-x-6 items-center w-full">
							<h1 className={title({ size: "sm" })}>
								<ProfileName {...profile} link={false} />
							</h1>

							<span className={pill({ class: "font-semibold", size: "sm" })}>
								<CircleCheckIcon size={16} /> <span>Active Member</span>
							</span>
						</div>

						<div className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-between gap-4 sm:w-full">
							{accolades.map(({ label, value }) => (
								<div key={label}>
									<span className="font-semibold">{label}</span>
									<div className="uppercase text-5xl font-semibold">
										{value}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				<pre>{JSON.stringify(profile, null, 2)}</pre>
			</Suspense>

			<Suspense>
				<div className="flex flex-col space-y-12 bg-content-background w-full py-16">
					<div className="px-4 max-w-5xl w-full mx-auto">
						<h2 className={title()}>Results</h2>
						<pre>{JSON.stringify(results, null, 2)}</pre>
					</div>
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
