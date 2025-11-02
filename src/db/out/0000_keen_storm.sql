CREATE TYPE "public"."role" AS ENUM('user', 'td', 'admin', 'superadmin');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'coed');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."player_role" AS ENUM('blocker', 'defender');--> statement-breakpoint
CREATE TYPE "public"."right_left" AS ENUM('right', 'left');--> statement-breakpoint
CREATE TYPE "public"."set_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."team_status" AS ENUM('registered', 'waitlisted', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('closed', 'running', 'paused', 'complete');--> statement-breakpoint
CREATE TYPE "public"."venue_status" AS ENUM('active', 'hidden', 'legacy');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"phone" text NOT NULL,
	"phone_verified" boolean NOT NULL,
	"image" text,
	"role" "role",
	"banned" boolean,
	"ban_reason" text,
	"ban_date" date,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"key" text PRIMARY KEY NOT NULL,
	"content" jsonb,
	"page" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"path" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directors" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"email" text,
	"phone" text,
	"external_ref" uuid NOT NULL,
	CONSTRAINT "directors_profileId_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "divisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"order" integer NOT NULL,
	"max_age" integer
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"bytes" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbreviated" text,
	"order" integer NOT NULL,
	CONSTRAINT "levels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "match_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"pool_match_id" integer,
	"playoff_match_id" integer,
	"set_number" integer NOT NULL,
	"team_a_score" integer DEFAULT 0 NOT NULL,
	"team_b_score" integer DEFAULT 0 NOT NULL,
	"win_score" integer DEFAULT 21 NOT NULL,
	"winner_id" integer,
	"status" "set_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"external_ref" uuid,
	CONSTRAINT "match_sets_externalRef_unique" UNIQUE("external_ref"),
	CONSTRAINT "match_type_exclusive" CHECK (("match_sets"."pool_match_id" IS NOT NULL AND "match_sets"."playoff_match_id" IS NULL) OR ("match_sets"."pool_match_id" IS NULL AND "match_sets"."playoff_match_id" IS NOT NULL)),
	CONSTRAINT "set_number_positive" CHECK ("match_sets"."set_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "player_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"first_name" text NOT NULL,
	"preferred_name" text,
	"last_name" text NOT NULL,
	"birthdate" date NOT NULL,
	"gender" "gender" NOT NULL,
	"level_id" integer,
	"rated_points" double precision DEFAULT 0 NOT NULL,
	"juniors_points" double precision DEFAULT 0 NOT NULL,
	"bio" text,
	"image_source" text,
	"height_feet" integer,
	"height_inches" integer,
	"dominant_arm" "right_left",
	"preferred_role" "player_role",
	"preferred_side" "right_left",
	"club" text,
	"high_school_graduation_year" integer,
	"college_team" text,
	"college_team_years_participated" integer,
	"external_ref" uuid DEFAULT gen_random_uuid() NOT NULL,
	CONSTRAINT "player_profiles_externalRef_unique" UNIQUE("external_ref"),
	CONSTRAINT "height_feet_check" CHECK ("player_profiles"."height_feet" >= 0 AND "player_profiles"."height_feet" <= 8),
	CONSTRAINT "height_inches_check" CHECK ("player_profiles"."height_inches" >= 0 AND "player_profiles"."height_inches" < 12)
);
--> statement-breakpoint
CREATE TABLE "playoff_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_division_id" integer NOT NULL,
	"round" text DEFAULT '-' NOT NULL,
	"match_number" integer NOT NULL,
	"court" text,
	"team_a_id" integer,
	"team_b_id" integer,
	"team_a_pool_id" integer,
	"team_b_pool_id" integer,
	"team_a_previous_match_id" integer,
	"team_b_previous_match_id" integer,
	"scheduled_time" timestamp,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"winner_id" integer,
	"next_match_id" integer,
	"external_ref" uuid,
	CONSTRAINT "playoff_matches_externalRef_unique" UNIQUE("external_ref"),
	CONSTRAINT "team_a_team_b_different_or_null" CHECK ("playoff_matches"."team_a_id" != "playoff_matches"."team_b_id" OR ("playoff_matches"."team_a_id" IS NULL AND "playoff_matches"."team_b_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "pool_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"pool_id" integer NOT NULL,
	"match_number" integer NOT NULL,
	"court" text,
	"team_a_id" integer,
	"team_b_id" integer,
	"scheduled_time" timestamp,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"winner_id" integer,
	"external_ref" uuid,
	CONSTRAINT "pool_matches_externalRef_unique" UNIQUE("external_ref"),
	CONSTRAINT "team_a_team_a_different" CHECK (("pool_matches"."team_a_id" IS NULL AND "pool_matches"."team_b_id" IS NULL) OR "pool_matches"."team_a_id" != "pool_matches"."team_b_id")
);
--> statement-breakpoint
CREATE TABLE "pool_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"pool_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"seed" integer,
	"finish" integer,
	CONSTRAINT "pool_team_unique" UNIQUE("pool_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "pools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tournament_division_id" integer NOT NULL,
	"court" text,
	"done" boolean DEFAULT false NOT NULL,
	"external_ref" uuid NOT NULL,
	CONSTRAINT "pools_externalRef_unique" UNIQUE("external_ref")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"shared_user_ids" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"owner_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar(500) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"project_id" serial NOT NULL,
	"user_ids" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"player_profile_id" integer NOT NULL,
	CONSTRAINT "team_player_unique" UNIQUE("team_id","player_profile_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text
);
--> statement-breakpoint
CREATE TABLE "tournament_directors" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"director_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tournament_directors_unique" UNIQUE("tournament_id","director_id")
);
--> statement-breakpoint
CREATE TABLE "tournament_division_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_division_id" integer NOT NULL,
	"gender" "gender",
	"qualified_division_id" integer
);
--> statement-breakpoint
CREATE TABLE "tournament_division_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_division_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"seed" integer,
	"finish" integer,
	"points_earned" double precision,
	"rating_earned" text,
	"status" "team_status" DEFAULT 'registered' NOT NULL,
	"external_ref" uuid NOT NULL,
	CONSTRAINT "tournament_division_teams_externalRef_unique" UNIQUE("external_ref")
);
--> statement-breakpoint
CREATE TABLE "tournament_divisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"division_id" integer NOT NULL,
	"name" text,
	"gender" "gender" NOT NULL,
	"team_size" integer DEFAULT 2 NOT NULL,
	"external_ref" uuid NOT NULL,
	CONSTRAINT "tournament_divisions_externalRef_unique" UNIQUE("external_ref"),
	CONSTRAINT "tournament_division_name_gender_unique" UNIQUE("tournament_id","division_id","name","gender")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"venue_id" integer NOT NULL,
	"external_ref" text
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"description" jsonb NOT NULL,
	"directions" jsonb NOT NULL,
	"map_url" text NOT NULL,
	"status" "venue_status" NOT NULL,
	"image_source" text,
	"external_ref" uuid NOT NULL,
	CONSTRAINT "venues_slug_unique" UNIQUE("slug"),
	CONSTRAINT "venues_externalRef_unique" UNIQUE("external_ref"),
	CONSTRAINT "name_city_unique" UNIQUE("name","city")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonated_by_users_id_fk" FOREIGN KEY ("impersonated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_page_pages_path_fk" FOREIGN KEY ("page") REFERENCES "public"."pages"("path") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directors" ADD CONSTRAINT "directors_profile_id_player_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_pool_match_id_pool_matches_id_fk" FOREIGN KEY ("pool_match_id") REFERENCES "public"."pool_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_playoff_match_id_playoff_matches_id_fk" FOREIGN KEY ("playoff_match_id") REFERENCES "public"."playoff_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_winner_id_tournament_division_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_tournament_division_id_tournament_divisions_id_fk" FOREIGN KEY ("tournament_division_id") REFERENCES "public"."tournament_divisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_a_id_tournament_division_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_b_id_tournament_division_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_a_pool_id_pools_id_fk" FOREIGN KEY ("team_a_pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_b_pool_id_pools_id_fk" FOREIGN KEY ("team_b_pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_a_previous_match_id_playoff_matches_id_fk" FOREIGN KEY ("team_a_previous_match_id") REFERENCES "public"."playoff_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_team_b_previous_match_id_playoff_matches_id_fk" FOREIGN KEY ("team_b_previous_match_id") REFERENCES "public"."playoff_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_winner_id_tournament_division_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playoff_matches" ADD CONSTRAINT "playoff_matches_next_match_id_playoff_matches_id_fk" FOREIGN KEY ("next_match_id") REFERENCES "public"."playoff_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_matches" ADD CONSTRAINT "pool_matches_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_matches" ADD CONSTRAINT "pool_matches_team_a_id_tournament_division_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_matches" ADD CONSTRAINT "pool_matches_team_b_id_tournament_division_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_matches" ADD CONSTRAINT "pool_matches_winner_id_tournament_division_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_teams" ADD CONSTRAINT "pool_teams_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_teams" ADD CONSTRAINT "pool_teams_team_id_tournament_division_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."tournament_division_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_tournament_division_id_tournament_divisions_id_fk" FOREIGN KEY ("tournament_division_id") REFERENCES "public"."tournament_divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_player_profile_id_player_profiles_id_fk" FOREIGN KEY ("player_profile_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_directors" ADD CONSTRAINT "tournament_directors_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_directors" ADD CONSTRAINT "tournament_directors_director_id_directors_id_fk" FOREIGN KEY ("director_id") REFERENCES "public"."directors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_division_requirements" ADD CONSTRAINT "tournament_division_requirements_tournament_division_id_tournament_divisions_id_fk" FOREIGN KEY ("tournament_division_id") REFERENCES "public"."tournament_divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_division_requirements" ADD CONSTRAINT "tournament_division_requirements_qualified_division_id_divisions_id_fk" FOREIGN KEY ("qualified_division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_division_teams" ADD CONSTRAINT "tournament_division_teams_tournament_division_id_tournament_divisions_id_fk" FOREIGN KEY ("tournament_division_id") REFERENCES "public"."tournament_divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_division_teams" ADD CONSTRAINT "tournament_division_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_divisions" ADD CONSTRAINT "tournament_divisions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_divisions" ADD CONSTRAINT "tournament_divisions_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_sets_pool_match_idx" ON "match_sets" USING btree ("pool_match_id");--> statement-breakpoint
CREATE INDEX "match_sets_playoff_match_idx" ON "match_sets" USING btree ("playoff_match_id");--> statement-breakpoint
CREATE INDEX "playoff_matches_tournament_division_idx" ON "playoff_matches" USING btree ("tournament_division_id");--> statement-breakpoint
CREATE INDEX "playoff_matches_team_a_idx" ON "playoff_matches" USING btree ("team_a_id");--> statement-breakpoint
CREATE INDEX "playoff_matches_team_b_idx" ON "playoff_matches" USING btree ("team_b_id");--> statement-breakpoint
CREATE INDEX "pool_matches_pool_idx" ON "pool_matches" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "pool_matches_team_a_idx" ON "pool_matches" USING btree ("team_a_id");--> statement-breakpoint
CREATE INDEX "pool_matches_team_b_idx" ON "pool_matches" USING btree ("team_b_id");--> statement-breakpoint
CREATE INDEX "pool_teams_pool_idx" ON "pool_teams" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "pool_teams_team_idx" ON "pool_teams" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_players_team_idx" ON "team_players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_players_player_idx" ON "team_players" USING btree ("player_profile_id");--> statement-breakpoint
CREATE INDEX "tournament_division_req_idx" ON "tournament_division_requirements" USING btree ("tournament_division_id");--> statement-breakpoint
CREATE INDEX "external_ref_idx" ON "venues" USING btree ("external_ref");