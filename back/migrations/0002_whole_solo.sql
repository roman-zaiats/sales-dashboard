CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"source_listing_id" text NOT NULL,
	"listing_id" text,
	"advice_index" integer,
	"area" text,
	"assigned_pos" text,
	"creation_date" timestamp with time zone,
	"creation_type" text,
	"event_id" text,
	"event_name" text,
	"exchange" text,
	"exchanges_for_sale" text[],
	"extra_fee" numeric,
	"face_value" numeric,
	"last_pos_modification_date" timestamp with time zone,
	"lower_price" numeric,
	"offer_id" text,
	"original_section" text,
	"places_ids" text[],
	"price" numeric(16, 4),
	"price_multiplier" numeric(16, 4),
	"pricing_rule_multiplier_change_time" timestamp with time zone,
	"quality" numeric,
	"quantity" integer,
	"row" text,
	"rule_price_multiplier_index" integer,
	"section" text,
	"split_rule" text,
	"start_row" text,
	"status" text,
	"status_change_date" timestamp with time zone,
	"sub_platform" text,
	"tags" text[],
	"ticket_type_name" text,
	"venue_name" text,
	"fees" jsonb,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "listings_sale_id_unique" UNIQUE("sale_id"),
	CONSTRAINT "listings_source_listing_id_unique" UNIQUE("source_listing_id")
);
--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT "sales_external_sale_id_unique";--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "external_sale_id";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "listing_id";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "event_id";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "source_payload";