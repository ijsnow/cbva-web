CREATE TABLE "match_refs" (
	"id" serial PRIMARY KEY,
	"pool_match_id" integer,
	"playoff_match_id" integer,
	"profile_id" integer NOT NULL,
	"abandoned" boolean,
	CONSTRAINT "match_ref_type_exclusive" CHECK (("pool_match_id" IS NOT NULL AND "playoff_match_id" IS NULL) OR ("pool_match_id" IS NULL AND "playoff_match_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX "match_ref_pool_match_idx" ON "match_refs" ("pool_match_id");--> statement-breakpoint
CREATE INDEX "match_ref_playoff_match_idx" ON "match_refs" ("playoff_match_id");--> statement-breakpoint
ALTER TABLE "match_refs" ADD CONSTRAINT "match_refs_pool_match_id_pool_matches_id_fkey" FOREIGN KEY ("pool_match_id") REFERENCES "pool_matches"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match_refs" ADD CONSTRAINT "match_refs_playoff_match_id_playoff_matches_id_fkey" FOREIGN KEY ("playoff_match_id") REFERENCES "playoff_matches"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match_refs" ADD CONSTRAINT "match_refs_profile_id_player_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "player_profiles"("id") ON DELETE CASCADE;