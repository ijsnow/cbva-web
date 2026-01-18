import { count, sql } from "drizzle-orm";
import type { DBQueryConfig } from "drizzle-orm/relations";
import type { KnownKeysOnly } from "drizzle-orm/utils";
import z from "zod";
import type { db } from "./connection";
import type { Database, Transaction } from "./schema";
import { omit } from "lodash-es";

export const pagingOptionsSchema = z.object({
	page: z.number().min(1).default(1),
	size: z.number().min(1).default(25),
});

export type PagingOptions = z.infer<typeof pagingOptionsSchema>;

export function getLimitAndOffset({ page, size }: PagingOptions) {
	return {
		limit: size,
		offset: size * (page - 1),
	};
}

type TableNames = keyof typeof db._query;
type Schema = NonNullable<typeof db._.schema>;
type Relations = NonNullable<typeof db._.relations>;

export type QueryConfig<TTableName extends TableNames> = Omit<
	DBQueryConfig<"many", Relations, Relations[TTableName]>,
	"limit" | "offset"
>;

export interface FindPagedOptions<
	TTableName extends TableNames,
	TConfig extends Omit<QueryConfig<TTableName>, "limit" | "offset">,
	TCountColumn extends keyof Relations[TTableName]["table"]["$inferSelect"],
> {
	paging: PagingOptions;
	query?: KnownKeysOnly<
		TConfig,
		Omit<
			DBQueryConfig<"many", Relations, Relations[TTableName]>,
			"limit" | "offset"
		>
	>;
	countColumn?: TCountColumn;
}

export async function findPaged<
	TTableName extends TableNames,
	TConfig extends Omit<
		DBQueryConfig<"many", Relations, Relations[TTableName]>,
		"limit" | "offset"
	>,
	TCountColumn extends keyof Relations[TTableName]["table"]["$inferSelect"],
>(
	db: Database | Transaction,
	table: TTableName,
	{
		paging,
		query,
		countColumn,
	}: FindPagedOptions<TTableName, TConfig, TCountColumn>,
) {
	const countQuery = omit(query, "with");

	const qCount = db.query[table].findMany({
		...countQuery,
		columns: countColumn ? { [countColumn]: true } : undefined,
	} as KnownKeysOnly<
		TConfig,
		DBQueryConfig<"many", Relations, Relations[TTableName]>
	>);

	const [result, countResult] = await Promise.all([
		db.query[table].findMany({
			...query,
			...getLimitAndOffset(paging),
		} as KnownKeysOnly<
			TConfig,
			DBQueryConfig<"many", Relations, Relations[TTableName]>
		>),
		db.select({ totalCount: count() }).from(sql`${qCount}`),
	]);

	const totalItems = countResult?.[0]?.totalCount ?? 0;

	return {
		data: result,
		pageInfo: {
			totalItems,
			totalPages: Math.ceil(totalItems / paging.size),
		},
	};
}
