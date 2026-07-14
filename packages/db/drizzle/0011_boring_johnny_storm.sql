CREATE TYPE "public"."tracking_destination_kind" AS ENUM('external_web', 'email', 'phone', 'calendar', 'download', 'internal_tab', 'other');--> statement-breakpoint
CREATE TABLE "tracking_event_manifests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"published_version_id" uuid NOT NULL,
	"recipient_id" uuid,
	"recipient_revision" integer,
	"schema_version" integer NOT NULL,
	"source_hash" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_event_manifests_recipient_revision_check" CHECK ((
        ("tracking_event_manifests"."recipient_id" is null and "tracking_event_manifests"."recipient_revision" is null)
        or ("tracking_event_manifests"."recipient_id" is not null and "tracking_event_manifests"."recipient_revision" is not null and "tracking_event_manifests"."recipient_revision" >= 0)
      )),
	CONSTRAINT "tracking_event_manifests_schema_version_check" CHECK ("tracking_event_manifests"."schema_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "tracking_recording_chunks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tracking_recording_usage_daily" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tracking_recordings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tracking_suppression_markers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tracking_recording_chunks" CASCADE;--> statement-breakpoint
DROP TABLE "tracking_recording_usage_daily" CASCADE;--> statement-breakpoint
DROP TABLE "tracking_recordings" CASCADE;--> statement-breakpoint
DROP TABLE "tracking_suppression_markers" CASCADE;--> statement-breakpoint
-- This pre-launch replacement intentionally discards data written by the superseded tracking design.
TRUNCATE TABLE "tracking_recipient_events", "tracking_recipient_sessions", "tracking_settings";--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" DROP CONSTRAINT "tracking_recipient_events_click_data_check";--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" DROP CONSTRAINT "tracking_recipient_events_webhook_data_check";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP CONSTRAINT "tracking_recipient_sessions_duration_check";--> statement-breakpoint
ALTER TABLE "tracking_settings" DROP CONSTRAINT "tracking_settings_retention_check";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP CONSTRAINT "trk_rec_sessions_version_fk";
--> statement-breakpoint
DROP INDEX "tracking_recipient_sessions_device_hash_idx";--> statement-breakpoint
DROP INDEX "tracking_recipient_sessions_ip_hash_idx";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ALTER COLUMN "published_version_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ALTER COLUMN "event_retention_days" SET DEFAULT 90;--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD COLUMN "manifest_id" uuid;--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD COLUMN "recipient_revision" integer;--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD COLUMN "page_id" varchar(160);--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD COLUMN "page_label" varchar(180);--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD COLUMN "from_page_id" varchar(160);--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD COLUMN "from_page_label" varchar(180);--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD COLUMN "destination_kind" "tracking_destination_kind";--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD COLUMN "destination_host" varchar(253);--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD COLUMN "webhook_endpoint_host" varchar(253);--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD COLUMN "manifest_id" uuid;--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD COLUMN "recipient_revision" integer;--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD COLUMN "initial_page_id" varchar(160) NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD COLUMN "initial_page_label" varchar(180) NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_event_manifests" ADD CONSTRAINT "tracking_event_manifests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_event_manifests" ADD CONSTRAINT "tracking_event_manifests_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_event_manifests" ADD CONSTRAINT "trk_event_manifests_version_fk" FOREIGN KEY ("published_version_id") REFERENCES "public"."site_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_event_manifests" ADD CONSTRAINT "trk_event_manifests_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."site_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_event_manifests_recipient_unique_idx" ON "tracking_event_manifests" USING btree ("published_version_id","recipient_id","recipient_revision","schema_version") WHERE "tracking_event_manifests"."recipient_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_event_manifests_default_unique_idx" ON "tracking_event_manifests" USING btree ("published_version_id","schema_version") WHERE "tracking_event_manifests"."recipient_id" is null;--> statement-breakpoint
CREATE INDEX "tracking_event_manifests_workspace_created_idx" ON "tracking_event_manifests" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "tracking_event_manifests_site_created_idx" ON "tracking_event_manifests" USING btree ("site_id","created_at");--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD CONSTRAINT "trk_rec_events_manifest_fk" FOREIGN KEY ("manifest_id") REFERENCES "public"."tracking_event_manifests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD CONSTRAINT "trk_rec_sessions_manifest_fk" FOREIGN KEY ("manifest_id") REFERENCES "public"."tracking_event_manifests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD CONSTRAINT "trk_rec_sessions_version_fk" FOREIGN KEY ("published_version_id") REFERENCES "public"."site_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracking_recipient_events_manifest_idx" ON "tracking_recipient_events" USING btree ("manifest_id");--> statement-breakpoint
CREATE INDEX "tracking_recipient_sessions_manifest_idx" ON "tracking_recipient_sessions" USING btree ("manifest_id");--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" DROP COLUMN "tab_label";--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" DROP COLUMN "element_href";--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" DROP COLUMN "webhook_url";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "device_id_hash";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "ip_address";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "ip_address_hash";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "user_agent_family";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "referrer_host";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "initial_path";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "max_scroll_depth_percent";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "recording_status";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "recording_object_key";--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP COLUMN "recording_duration_ms";--> statement-breakpoint
ALTER TABLE "tracking_settings" DROP COLUMN "capture_ip_address";--> statement-breakpoint
ALTER TABLE "tracking_settings" DROP COLUMN "raw_ip_retention_days";--> statement-breakpoint
ALTER TABLE "tracking_settings" DROP COLUMN "recording_enabled";--> statement-breakpoint
ALTER TABLE "tracking_settings" DROP COLUMN "recording_retention_days";--> statement-breakpoint
ALTER TABLE "tracking_settings" DROP COLUMN "max_recording_duration_seconds";--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD CONSTRAINT "tracking_recipient_events_click_data_check" CHECK ((
        ("tracking_recipient_events"."type" = 'link_click' and "tracking_recipient_events"."destination_kind" is not null and "tracking_recipient_events"."element_kind" = 'sidebar_link')
        or ("tracking_recipient_events"."type" = 'tab_switch' and "tracking_recipient_events"."element_kind" = 'tab')
        or ("tracking_recipient_events"."type" = 'button_click' and "tracking_recipient_events"."destination_kind" is not null and "tracking_recipient_events"."element_kind" in ('button', 'sidebar_button', 'image_card'))
        or ("tracking_recipient_events"."type" not in ('button_click', 'link_click', 'tab_switch'))
      ));--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD CONSTRAINT "tracking_recipient_events_webhook_data_check" CHECK ((
        ("tracking_recipient_events"."type" = 'webhook_send' and "tracking_recipient_events"."webhook_id" is not null and "tracking_recipient_events"."webhook_endpoint_host" is not null)
        or ("tracking_recipient_events"."type" <> 'webhook_send')
      ));--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD CONSTRAINT "tracking_recipient_sessions_duration_check" CHECK ("tracking_recipient_sessions"."active_ms" >= 0
        and ("tracking_recipient_sessions"."duration_ms" is null or "tracking_recipient_sessions"."duration_ms" >= 0));--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD CONSTRAINT "tracking_settings_retention_check" CHECK ("tracking_settings"."event_retention_days" in (30, 90, 180, 365));--> statement-breakpoint
DROP TYPE "public"."tracking_recording_status";--> statement-breakpoint
DROP TYPE "public"."tracking_suppression_marker_type";
