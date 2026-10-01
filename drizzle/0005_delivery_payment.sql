CREATE TYPE "public"."delivery_payment" AS ENUM('online', 'on_arrival');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_payment" "delivery_payment" DEFAULT 'online' NOT NULL;