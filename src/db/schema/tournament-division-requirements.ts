import { relations } from "drizzle-orm/_relations";
import { index, integer, pgTable, serial } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { divisions } from "./divisions";
import { genderEnum } from "./shared";
import { tournamentDivisions } from "./tournament-divisions";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const tournamentDivisionRequirements = pgTable(
	"tournament_division_requirements",
	{
		id: serial().primaryKey(),
		tournamentDivisionId: integer()
			.notNull()
			.references(() => tournamentDivisions.id, { onDelete: "cascade" }),
		gender: genderEnum(),
		qualifiedDivisionId: integer().references(() => divisions.id),
		minimum: integer(),
	},
	(table) => [
		index("tournament_division_req_idx").on(table.tournamentDivisionId),
	],
);

export const selectTournamentDivisionRequirementSchema = createSelectSchema(
	tournamentDivisionRequirements,
);
export const createTournamentDivisionRequirementSchema = createInsertSchema(
	tournamentDivisionRequirements,
).omit({
	id: true,
});
export const updateTournamentDivisionRequirementSchema = createUpdateSchema(
	tournamentDivisionRequirements,
);

export type TournamentDivisionRequirement = z.infer<
	typeof selectTournamentDivisionRequirementSchema
>;
export type CreateTournamentDivisionRequirement = z.infer<
	typeof createTournamentDivisionRequirementSchema
>;
export type UpdateTournamentDivisionRequirement = z.infer<
	typeof updateTournamentDivisionRequirementSchema
>;

export const tournamentDivisionRequirementsRelations = relations(
	tournamentDivisionRequirements,
	({ one }) => ({
		tournamentDivisions: one(tournamentDivisions, {
			fields: [tournamentDivisionRequirements.tournamentDivisionId],
			references: [tournamentDivisions.id],
		}),
	}),
);
