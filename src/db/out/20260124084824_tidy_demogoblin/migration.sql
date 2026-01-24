CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY,
	"transaction_key" text NOT NULL,
	"purchaser_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournamentRegistrations" (
	"id" serial PRIMARY KEY,
	"tournament_division_team_id" integer NOT NULL,
	"invoice_id" integer NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_purchaser_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "invoice_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "memberships" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "memberships" DROP COLUMN "transaction_key";--> statement-breakpoint
ALTER TABLE "memberships" DROP COLUMN "purchaser_id";--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchaser_id_users_id_fkey" FOREIGN KEY ("purchaser_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "tournamentRegistrations" ADD CONSTRAINT "tournamentRegistrations_1JB1MwfoJBbO_fkey" FOREIGN KEY ("tournament_division_team_id") REFERENCES "tournament_division_teams"("id");--> statement-breakpoint
ALTER TABLE "tournamentRegistrations" ADD CONSTRAINT "tournamentRegistrations_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");