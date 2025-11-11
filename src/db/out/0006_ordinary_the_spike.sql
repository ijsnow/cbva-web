ALTER TABLE "playoff_matches" DROP CONSTRAINT "playoff_matches_team_a_pool_id_pools_id_fk";
--> statement-breakpoint
ALTER TABLE "playoff_matches" DROP CONSTRAINT "playoff_matches_team_b_pool_id_pools_id_fk";
--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_a_pool_id_pools_id_fk" FOREIGN KEY ("team_a_pool_id") REFERENCES "public"."pools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_b_pool_id_pools_id_fk" FOREIGN KEY ("team_b_pool_id") REFERENCES "public"."pools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_matches" ADD CONSTRAINT "pool_matches_pool_id_match_number" UNIQUE("pool_id","match_number");