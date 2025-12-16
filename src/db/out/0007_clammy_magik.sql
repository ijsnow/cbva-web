CREATE TABLE "rate_limiter_flexible" (
	"key" text PRIMARY KEY NOT NULL,
	"points" integer NOT NULL,
	"expire" timestamp
);
