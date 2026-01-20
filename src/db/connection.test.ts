import { sql } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";

describe("@/db/connection", () => {
	test("db connection works", async () => {
		const result = await db.execute(sql`select 1 as one`);

		expect(result[0].one).toBe(1);
	});
});
