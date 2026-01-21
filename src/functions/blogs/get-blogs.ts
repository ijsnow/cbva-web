import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";
import { isDefined } from "@/utils/types";
import { selectBlogSchema } from "@/db/schema";

export const getBlogsSchema = selectBlogSchema.pick({
	tag: true,
});

export const getBlogs = createServerFn({
	method: "GET",
})
	.inputValidator(getBlogsSchema)
	.handler(async ({ data: { tag } }) => {
		return await db.query.blogs.findMany({
			where: {
				tag,
			},
			orderBy: (t, { asc }) => [asc(t.order)],
		});
	});

export const getBlogsQueryOptions = (tag: string) =>
	queryOptions({
		queryKey: ["getBlogs", tag].filter(isDefined),
		queryFn: () => getBlogs({ data: { tag } }),
	});
