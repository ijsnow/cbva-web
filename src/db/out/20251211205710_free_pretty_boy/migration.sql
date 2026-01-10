ALTER TABLE "venues" RENAME COLUMN "default_director_id" TO "director_id";--> statement-breakpoint
ALTER TABLE "venues" DROP CONSTRAINT "venues_default_director_id_directors_id_fk";
--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_director_id_directors_id_fk" FOREIGN KEY ("director_id") REFERENCES "public"."directors"("id") ON DELETE no action ON UPDATE no action;