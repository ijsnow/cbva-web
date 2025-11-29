import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { EditIcon, PlusIcon, UserCircleIcon } from "lucide-react";
import { useState } from "react";
import { Button, button } from "@/components/base/button";
import { title } from "@/components/base/primitives";
import { ProfileList } from "@/components/profiles/list";
import { ProfileForm } from "@/components/users/profile-form";
import { viewerProfileQueryOptions } from "@/data/profiles";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/account/setup")({
	head: () => ({
		meta: [{ title: "Account Setup" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { data: viewerProfiles } = useSuspenseQuery(
		viewerProfileQueryOptions(),
	);

	// async function fetchDefaultValues(): Promise<Partial<CreatePlayerProfile>> {
	//   if (Boolean(viewerProfiles?.length)) {
	//     return {};
	//   }

	//   const viewer = await fetchViewer();

	//   return {
	//     name: viewer.name,
	//   };
	// }

	const [isCreatingAnother, setIsCreatingAnother] = useState(false);

	const showForm = !Boolean(viewerProfiles?.length) || isCreatingAnother;

	return (
		<DefaultLayout>
			<div className="text-center flex flex-col space-y-6 max-w-xl mx-auto">
				<h1 className={title({ size: "lg" })}>Account Setup</h1>
			</div>

			<div className="rounded-md bg-white p-8 max-w-lg mx-auto">
				<h2 className="text-2xl font-bold text-center mb-8">
					Step 3: Create your Player Profile(s)
				</h2>

				<div className="space-y-4">
					<div className="space-y-3">
						<p className="text-center w-8/10 mx-auto">
							Create profiles for yourself and/or each of your children who will
							be playing.
						</p>

						{!showForm && viewerProfiles && (
							<>
								<hr className="border-gray-300" />

								<ProfileList profiles={viewerProfiles} linkNames={false} />

								<div className="flex flex-col items-stretch gap-y-2">
									<Button
										variant="outline"
										color="primary"
										onPress={() => {
											setIsCreatingAnother(true);
										}}
									>
										<PlusIcon />

										<span>Create Another</span>
									</Button>

									<Link className={button({ color: "primary" })} to="/account">
										<span>Continue</span>
									</Link>
								</div>
							</>
						)}

						{showForm && (
							<ProfileForm
								onSuccess={() => {
									setIsCreatingAnother(false);
								}}
								onCancel={
									isCreatingAnother
										? () => {
												setIsCreatingAnother(false);
											}
										: undefined
								}
							/>
						)}
					</div>
				</div>
			</div>
		</DefaultLayout>
	);
}
