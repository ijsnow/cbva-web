ALTER TABLE "match_sets" DROP CONSTRAINT "match_sets_winner_id_tournament_division_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_winner_id_tournament_division_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE cascade ON UPDATE no action;