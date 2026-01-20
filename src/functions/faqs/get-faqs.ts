import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";

async function readFaqs() {
	return await db.query.faqs.findMany({
		orderBy: (t, { asc }) => [asc(t.order)],
	});
}

export const getFaqs = createServerFn({
	method: "GET",
}).handler(async () => await readFaqs());

export const getFaqsQueryOptions = () =>
	queryOptions({
		queryKey: ["getFaqs"],
		queryFn: () => getFaqs(),
	});
