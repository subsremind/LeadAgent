CREATE TABLE "agent_setting" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"description" text NOT NULL,
	"subreddit" text,
	"query" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_setting_query_unique" UNIQUE("query")
);
--> statement-breakpoint
ALTER TABLE "agent_setting" ADD CONSTRAINT "agent_setting_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;