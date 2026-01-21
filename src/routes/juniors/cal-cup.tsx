import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Suspense } from "react";
import { useViewerHasPermission } from "@/auth/shared";
import { title } from "@/components/base/primitives";
import { RichTextDisplay } from "@/components/base/rich-text-editor/display";
import { contentPageBlocksQueryOptions, updatePageFn } from "@/data/blocks";
import { divisionsQueryOptions } from "@/data/divisions";
import type { CreateBlock } from "@/db/schema";
import type { LexicalState } from "@/db/schema/shared";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/juniors/cal-cup")({
	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData(contentPageBlocksQueryOptions("cal-cup")),
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
		...contentPageBlocksQueryOptions("cal-cup"),
		select: (data) => new Map(data.map(({ key, content }) => [key, content])),
	});

	const mutationFn = useServerFn(updatePageFn);

	const queryClient = useQueryClient();

	const { mutateAsync } = useMutation({
		mutationFn: async (input: Pick<CreateBlock, "content" | "key">) => {
			return mutationFn({
				data: {
					page: "cal-cup",
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

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 px-2 max-w-2xl mx-auto flex flex-col space-y-12",
			}}
		>
			<Suspense>
				<img
					src="/logos/cal-cup.svg"
					alt="Cal Cup"
					className="max-w-md mx-auto"
				/>

				<div>
					{blocks?.has("cal-cup") && (
						<RichTextDisplay
							name="juniors"
							content={blocks.get("cal-cup")}
							onSave={
								canEdit
									? async (state) => {
											await mutateAsync({
												key: "cal-cup",
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
