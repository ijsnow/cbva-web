ALTER TABLE "player_profiles" DROP CONSTRAINT "player_profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;