CREATE TABLE "venue_directors" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_id" integer NOT NULL,
	"director_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "venue_directors_unique" UNIQUE("venue_id","director_id")
);
--> statement-breakpoint
ALTER TABLE "venue_directors" ADD CONSTRAINT "venue_directors_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_directors" ADD CONSTRAINT "venue_directors_director_id_directors_id_fk" FOREIGN KEY ("director_id") REFERENCES "public"."directors"("id") ON DELETE no action ON UPDATE no action;