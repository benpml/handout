CREATE TYPE "public"."analytics_event_type" AS ENUM('site_viewed', 'heartbeat', 'scroll_depth_reached', 'element_clicked', 'button_clicked', 'link_clicked', 'calendar_booked', 'link_preview_loaded');--> statement-breakpoint
CREATE TYPE "public"."site_access_role" AS ENUM('none', 'view_copy', 'edit');--> statement-breakpoint
CREATE TYPE "public"."site_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."site_variant_status" AS ENUM('active', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."site_version_kind" AS ENUM('initial', 'autosave', 'publish', 'rollback', 'migration');--> statement-breakpoint
CREATE TYPE "public"."site_visibility" AS ENUM('private', 'team');--> statement-breakpoint
CREATE TYPE "public"."workspace_member_status" AS ENUM('active', 'removed');--> statement-breakpoint
CREATE TYPE "public"."workspace_plan" AS ENUM('basic', 'pro');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."workspace_status" AS ENUM('active', 'suspended', 'scheduled_for_deletion', 'deleted');--> statement-breakpoint
CREATE TABLE "account" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"variant_id" uuid,
	"type" "analytics_event_type" NOT NULL,
	"event_name" varchar(160) NOT NULL,
	"target_label" varchar(180),
	"target_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_user_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"can_access_debug_tools" boolean DEFAULT false NOT NULL,
	"can_access_support_tools" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" varchar(191) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"workspace_member_id" uuid,
	"entire_team" boolean DEFAULT false NOT NULL,
	"role" "site_access_role" DEFAULT 'view_copy' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(96) NOT NULL,
	"recipient_name" varchar(160),
	"recipient_company" varchar(160),
	"variable_values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"status" "site_variant_status" DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"kind" "site_version_kind" NOT NULL,
	"label" varchar(160),
	"content" jsonb NOT NULL,
	"variables_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by_user_id" varchar(191),
	"published_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_by_user_id" varchar(191) NOT NULL,
	"updated_by_user_id" varchar(191),
	"published_by_user_id" varchar(191),
	"archived_by_user_id" varchar(191),
	"name" varchar(160) NOT NULL,
	"slug" varchar(96) NOT NULL,
	"status" "site_status" DEFAULT 'draft' NOT NULL,
	"visibility" "site_visibility" DEFAULT 'private' NOT NULL,
	"draft_content" jsonb DEFAULT '{"schemaVersion":1,"header":{"avatarMode":"single","title":"Untitled Lightsite"},"settings":{"showTableOfContents":true,"allowSearchIndexing":false},"variables":[],"blocks":[]}'::jsonb NOT NULL,
	"draft_revision" integer DEFAULT 1 NOT NULL,
	"published_version_id" uuid,
	"published_at" timestamp with time zone,
	"last_unpublished_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(320) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" varchar(191) PRIMARY KEY NOT NULL,
	"account_setup_completed_at" timestamp with time zone,
	"last_active_workspace_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"role" "workspace_role" DEFAULT 'user' NOT NULL,
	"status" "workspace_member_status" DEFAULT 'active' NOT NULL,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"website_domain" varchar(253),
	"logo_asset_id" uuid,
	"plan" "workspace_plan" DEFAULT 'basic' NOT NULL,
	"status" "workspace_status" DEFAULT 'active' NOT NULL,
	"scheduled_deletion_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_variant_id_site_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."site_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_access" ADD CONSTRAINT "site_access_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_access" ADD CONSTRAINT "site_access_workspace_member_id_workspace_members_id_fk" FOREIGN KEY ("workspace_member_id") REFERENCES "public"."workspace_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_variants" ADD CONSTRAINT "site_variants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_variants" ADD CONSTRAINT "site_variants_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_versions" ADD CONSTRAINT "site_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_versions" ADD CONSTRAINT "site_versions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_last_active_workspace_id_workspaces_id_fk" FOREIGN KEY ("last_active_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_events_workspace_occurred_at_idx" ON "analytics_events" USING btree ("workspace_id","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_site_occurred_at_idx" ON "analytics_events" USING btree ("site_id","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_variant_occurred_at_idx" ON "analytics_events" USING btree ("variant_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "internal_user_access_user_idx" ON "internal_user_access" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "site_access_site_member_idx" ON "site_access" USING btree ("site_id","workspace_member_id") WHERE "site_access"."workspace_member_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "site_access_site_entire_team_idx" ON "site_access" USING btree ("site_id") WHERE "site_access"."entire_team" = true;--> statement-breakpoint
CREATE INDEX "site_access_site_idx" ON "site_access" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_variants_site_slug_idx" ON "site_variants" USING btree ("site_id","slug");--> statement-breakpoint
CREATE INDEX "site_variants_workspace_updated_at_idx" ON "site_variants" USING btree ("workspace_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "site_versions_site_version_number_idx" ON "site_versions" USING btree ("site_id","version_number");--> statement-breakpoint
CREATE INDEX "site_versions_site_created_at_idx" ON "site_versions" USING btree ("site_id","created_at");--> statement-breakpoint
CREATE INDEX "site_versions_workspace_created_at_idx" ON "site_versions" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_workspace_slug_idx" ON "sites" USING btree ("workspace_id","slug");--> statement-breakpoint
CREATE INDEX "sites_workspace_status_updated_at_idx" ON "sites" USING btree ("workspace_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "sites_published_version_idx" ON "sites" USING btree ("published_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_profiles_last_active_workspace_idx" ON "user_profiles" USING btree ("last_active_workspace_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_workspace_user_idx" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_active_workspace_role_idx" ON "workspace_members" USING btree ("workspace_id","status","role");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_idx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "workspaces_status_idx" ON "workspaces" USING btree ("status");