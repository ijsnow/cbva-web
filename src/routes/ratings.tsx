import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, useState } from "react";
import { useViewerHasPermission } from "@/auth/shared";
import { title } from "@/components/base/primitives";
import { RichTextDisplay } from "@/components/base/rich-text-editor/display";
import { Select } from "@/components/base/select";
import { contentPageBlocksQueryOptions, updatePageFn } from "@/data/blocks";
import { divisionsQueryOptions } from "@/data/divisions";
import type { CreateBlock } from "@/db/schema";
import type { Gender, LexicalState } from "@/db/schema/shared";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/ratings")({
	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData(contentPageBlocksQueryOptions("ratings")),
			queryClient.ensureQueryData(divisionsQueryOptions(false)),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const canEdit = useViewerHasPermission({
		content: ["update"],
	});

	const { data: blocks } = useSuspenseQuery({
		...contentPageBlocksQueryOptions("ratings"),
		select: (data) => new Map(data.map(({ key, content }) => [key, content])),
	});

	const { data: divisions } = useSuspenseQuery({
		...divisionsQueryOptions(false),
		select: (data) =>
			data
				.sort((a, b) => b.order - a.order)
				.map((d) => ({
					display: d.name.toUpperCase(),
					value: d.id,
					order: d.order,
				})),
	});

	const mutationFn = useServerFn(updatePageFn);
	const queryClient = useQueryClient();

	const { mutateAsync } = useMutation({
		mutationFn: async (input: Pick<CreateBlock, "content" | "key">) => {
			return mutationFn({
				data: {
					page: "ratings",
					...input,
				},
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [],
			});
		},
	});

	const [gender, setGender] = useState<Gender>("male");
	const [division, setDivision] = useState<number | undefined>(
		divisions.at(0)?.value,
	);

	const tableMap: { [key: string]: string } = {
		open: "open",
		aaa: "open",
	};

	const divisionName = divisions
		.find(({ value }) => value === division)
		?.display.toLowerCase();

	const genderDivisionKey =
		divisionName && tableMap[divisionName]
			? tableMap[divisionName]
			: `${gender}-${divisionName}`;

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 px-2 max-w-2xl mx-auto flex flex-col space-y-12",
			}}
		>
			<Suspense>
				<h1
					className={title({
						class: "w-full text-center ",
					})}
				>
					Ratings
				</h1>
				<div>
					{blocks?.has("ratings") && (
						<RichTextDisplay
							name="ratings"
							content={blocks.get("ratings")}
							onSave={
								canEdit
									? async (state) => {
											await mutateAsync({
												key: "ratings",
												content: state as LexicalState,
											});
										}
									: undefined
							}
						/>
					)}
				</div>
				<div>
					{/*TODO: Picker for each combo of ratings/gender. Additionally, combine
          into one query for all blocks on this page and reduce into map. Also
          look at headings and remove the Ratings title at top.*/}
					<div className="flex flex-col gap-3">
						<div className="flex flex-row justify-center gap-3">
							<Select
								className="bg-white flex-1"
								options={[
									["Men's", "male" as Gender],
									["Women's", "female" as Gender],
								].map(([display, value]) => ({
									display,
									value,
								}))}
								value={gender}
								onChange={(value) =>
									setGender((value as Gender | null) || "male")
								}
							/>
							<Select
								className="bg-white flex-1"
								options={divisions}
								value={division}
								onChange={(value) => setDivision((value as number | null) || 0)}
							/>
						</div>
						<div className="relative">
							{blocks?.has(genderDivisionKey) && (
								<RichTextDisplay
									name={genderDivisionKey}
									content={blocks.get(genderDivisionKey)}
									onSave={
										canEdit
											? async (state) => {
													await mutateAsync({
														key: genderDivisionKey,
														content: state as LexicalState,
													});
												}
											: undefined
									}
								/>
							)}
						</div>
						{divisions.find((l) => l.display === "OPEN" || "AAA")?.value ===
							division && (
							<div className="relative">
								{blocks?.has("prize-pool") && (
									<RichTextDisplay
										name="prize-pool"
										content={blocks.get("prize-pool")}
										onSave={
											canEdit
												? async (state) => {
														await mutateAsync({
															key: "prize-pool",
															content: state as LexicalState,
														});
													}
												: undefined
										}
									/>
								)}
							</div>
						)}
					</div>
				</div>
				<div className="flex flex-col">
					{blocks?.has("sanction-requirements") && (
						<RichTextDisplay
							name="sanction-requirements"
							content={blocks.get("sanction-requirements")}
							onSave={
								canEdit
									? async (state) => {
											await mutateAsync({
												key: "sanction-requirements",
												content: state as LexicalState,
											});
										}
									: undefined
							}
						/>
					)}
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
