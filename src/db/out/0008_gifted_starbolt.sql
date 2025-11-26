ALTER TABLE "users" RENAME COLUMN "phone" TO "phone_number";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "phone_verified" TO "phone_number_verified";--> statement-breakpoint
ALTER TABLE "directors" RENAME COLUMN "phone" TO "phone_number";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_phone_unique";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phoneNumber_unique" UNIQUE("phone_number");