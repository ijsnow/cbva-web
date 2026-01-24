import { date, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { playerProfiles } from "./player-profiles";
import { users } from "./auth";
import { timestamps } from "./shared";
import { tournamentDivisionTeams } from "./tournament-division-teams";

const { createSelectSchema } = createSchemaFactory({ zodInstance: z });

export const invoices = pgTable("invoices", {
	id: serial().primaryKey(),
	transactionKey: text().notNull(),
	purchaserId: text()
		.notNull()
		.references(() => users.id),
});

export const selectInvoiceSchema = createSelectSchema(invoices);

export type Invoice = z.infer<typeof selectInvoiceSchema>;

export const memberships = pgTable("memberships", {
	id: serial().primaryKey(),
	validUntil: date().notNull(),
	profileId: integer()
		.notNull()
		.references(() => playerProfiles.id),
	invoiceId: integer()
		.notNull()
		.references(() => invoices.id),
	...timestamps,
});

export const selectMembershipSchema = createSelectSchema(memberships);

export type Membership = z.infer<typeof selectMembershipSchema>;

export const tournamentRegistrations = pgTable("tournamentRegistrations", {
	id: serial().primaryKey(),
	tournamentDivisionTeamId: integer()
		.notNull()
		.references(() => tournamentDivisionTeams.id),
	invoiceId: integer()
		.notNull()
		.references(() => invoices.id),
	...timestamps,
});
