import { createFileRoute } from "@tanstack/react-router";
import { DefaultLayout } from "@/layouts/default";
import { subtitle, title } from "@/components/base/primitives";
import { getBlogsQueryOptions } from "@/functions/blogs/get-blogs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { RichTextDisplay } from "@/components/base/rich-text-editor/display";
import { useViewerHasPermission } from "@/auth/shared";
import { CreateBlogForm } from "@/components/blogs/create-blog-form";
import { UpdateBlogForm } from "@/components/blogs/update-blog-form";
import { DeleteBlogForm } from "@/components/blogs/delete-blog-form";
import { ReorderBlogsForm } from "@/components/blogs/reorder-blog-form";

export const Route = createFileRoute("/info/cedars")({
	loader: ({ context: { queryClient } }) => {
		return queryClient.ensureQueryData(getBlogsQueryOptions("cedars"));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data: blogs } = useSuspenseQuery(getBlogsQueryOptions("cedars"));

	const canCreate = useViewerHasPermission({
		blogs: ["create"],
	});

	const canUpdate = useViewerHasPermission({
		blogs: ["update"],
	});

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 px-2 max-w-2xl mx-auto flex flex-col space-y-12",
			}}
		>
			<div className="flex flex-col space-y-6 text-center">
				<div className="flex justify-center items-center gap-2">
					<h1 className={title()}>Injury Prevention and Wellness</h1>
				</div>
				<p className={subtitle()}>Sponsored Content From</p>
				<a
					className="mx-auto"
					href="https://www.cedars-sinai.org/programs/ortho/specialties/sports-medicine.html"
					target="_blank"
					rel="noreferrer"
				>
					<img
						src="/logos/cedars-sinai.svg"
						className="mx-auto w-[270px]"
						alt="Cedars-Sinai"
					/>
				</a>
			</div>
			<div className="flex flex-col bg-sand max-w-[500px] mx-auto items-center justify-center">
				<div className="self-end flex flex-row gap-2 px-6">
					{canUpdate && <ReorderBlogsForm tag="cedars" />}
					{canCreate && <CreateBlogForm tag="cedars" />}
				</div>
				<ul>
					{blogs?.map(({ id, title, summary, imageSource, link }) => (
						<li
							key={id}
							className="relative bg-white my-8 mx-6 rounded-xl overflow-hidden group"
						>
							<a href={link} target="_blank" rel="noreferrer">
								{imageSource && (
									<img src={imageSource} className="w-full" alt={title} />
								)}
								<div className="bg-navbar-background p-2 pl-3 text-left text-navbar-foreground text-lg font-semibold sm:text-xl group-hover:underline">
									<p>{title}</p>
								</div>
								<div className="my-4 mx-4 contents-center text-neutral-700">
									<RichTextDisplay
										name="faq-answer"
										content={
											typeof summary === "string"
												? JSON.parse(summary)
												: summary
										}
									/>
									<p className="underline">Read More</p>
								</div>
							</a>
							{canUpdate && (
								<div className="flex justify-end gap-2 px-2 py-1 rounded-md bg-white/50 absolute top-3 right-3">
									<UpdateBlogForm id={id} tag="cedars" />
									<DeleteBlogForm id={id} blogTitle={title} tag="cedars" />
								</div>
							)}
						</li>
					))}
				</ul>
			</div>
		</DefaultLayout>
	);
}
