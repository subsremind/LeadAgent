DROP INDEX "category_biz_idx";--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "platform" text NOT NULL;--> statement-breakpoint
CREATE INDEX "category_platform_idx" ON "category" USING btree ("platform");--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "business_id";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "business_type";