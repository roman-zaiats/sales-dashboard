CREATE TABLE "ingestion_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"inserted_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_tags" (
	"sale_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "sale_tags_sale_id_tag_id_pk" PRIMARY KEY("sale_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_sale_id" text NOT NULL,
	"listing_id" text,
	"event_id" text,
	"quantity" integer,
	"price" numeric(16, 4),
	"currency" text,
	"buyer_email" text,
	"source_payload" jsonb,
	"status" text NOT NULL,
	"delivery_delay_at" timestamp with time zone,
	"problem_reason" text,
	"filled_by_user_id" uuid,
	"source_created_at" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"source_sync_state" text,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "sales_external_sale_id_unique" UNIQUE("external_sale_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"auth_sub" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "users_auth_sub_unique" UNIQUE("auth_sub")
);
--> statement-breakpoint
ALTER TABLE "sale_comments" ADD CONSTRAINT "sale_comments_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_comments" ADD CONSTRAINT "sale_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_tags" ADD CONSTRAINT "sale_tags_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_tags" ADD CONSTRAINT "sale_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_filled_by_user_id_users_id_fk" FOREIGN KEY ("filled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;