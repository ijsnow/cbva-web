import { eq, lte } from "drizzle-orm";
import { type Database, divisions, levels } from "@/db/schema";

export async function getQualifiedLevels(db: Database, division: string) {
	const [{ order }] = await db
		.select()
		.from(divisions)
		.where(eq(divisions.name, division));

	return await db.select().from(levels).where(lte(levels.order, order));
}
