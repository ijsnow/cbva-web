ALTER TABLE "venues" DROP CONSTRAINT "venues_director_id_directors_id_fk";
--> statement-breakpoint
ALTER TABLE "venues" DROP COLUMN "director_id";--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "director_id" text;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_director_id_users_id_fk" FOREIGN KEY ("director_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
