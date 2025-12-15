import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const rateLimiterFlexibleSchema = pgTable("rate_limiter_flexible", {
	key: text("key").primaryKey(),
	points: integer("points").notNull(),
	expire: timestamp("expire"),
});
