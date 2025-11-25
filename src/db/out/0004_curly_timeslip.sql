ALTER TABLE "directors" ALTER COLUMN "external_ref" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "playoff_matches" ALTER COLUMN "round" SET DEFAULT -1;