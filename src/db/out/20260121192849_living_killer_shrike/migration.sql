CREATE TABLE "blogs" (
	"id" serial,
	"tag" text NOT NULL,
	"link" text NOT NULL,
	"title" text NOT NULL,
	"summary" jsonb NOT NULL,
	"order" integer
);
