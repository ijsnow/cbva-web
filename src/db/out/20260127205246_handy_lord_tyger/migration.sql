CREATE TYPE "tshirt-size" AS ENUM('xs', 'sm', 'm', 'l', 'xl', 'xxl');--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "tshirt_size" "tshirt-size";