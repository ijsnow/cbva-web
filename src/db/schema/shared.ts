import { jsonb, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import type z from "zod";

export const timestamps = {
	createdAt: timestamp().$defaultFn(() => /* @__PURE__ */ new Date()),
	updatedAt: timestamp()
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.$onUpdateFn(() => new Date()),
};

export type LexicalState = {
	root: {
		children: Array<any>;
		direction: "ltr" | "rtl" | null;
		format: "" | "left" | "start" | "center" | "right" | "end" | "justify" | "";
		indent: number;
		type: "root";
		version: number;
	};
};

export function richText() {
	return jsonb().$type<LexicalState>();
}

export const genderEnum = pgEnum("gender", ["male", "female", "coed"]);

export const genderSchema = createSelectSchema(genderEnum);

export type Gender = z.infer<typeof genderSchema>;

export const rightLeftEnum = pgEnum("right_left", ["right", "left"]);

export const playerRoleEnum = pgEnum("player_role", ["blocker", "defender"]);

export const tournamentStatusEnum = pgEnum("tournament_status", [
	"closed",
	"running",
	"paused",
	"complete",
]);

export const teamStatusEnum = pgEnum("team_status", [
	"registered",
	"waitlisted",
	"confirmed",
	"cancelled",
	"withdraw",
	"late-withdraw",
]);

export const teamStatusSchema = createSelectSchema(teamStatusEnum);

export type TeamStatus = z.infer<typeof teamStatusSchema>;

export const venueStatusEnum = pgEnum("venue_status", [
	"active",
	"hidden",
	"legacy",
]);

export const matchStatusEnum = pgEnum("match_status", [
	"scheduled",
	"in_progress",
	"completed",
	"cancelled",
]);

export type MatchStatus = z.infer<typeof matchStatusEnum>;

export const setStatusEnum = pgEnum("set_status", [
	"not_started",
	"in_progress",
	"completed",
]);
