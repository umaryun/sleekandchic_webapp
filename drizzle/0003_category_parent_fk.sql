-- Clear parent links the new constraint would reject: parents that no
-- longer exist and categories set as their own parent.
UPDATE "categories" SET "parent_id" = NULL
WHERE "parent_id" = "id" OR ("parent_id" IS NOT NULL AND "parent_id" NOT IN (SELECT "id" FROM "categories"));--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");