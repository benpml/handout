CREATE TYPE "public"."tracking_recording_status" AS ENUM('disabled', 'pending', 'recording', 'available', 'truncated', 'failed', 'expired', 'deleted');--> statement-breakpoint
CREATE TABLE "tracking_recording_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recording_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"object_key" text NOT NULL,
	"event_count" integer NOT NULL,
	"compressed_bytes" integer NOT NULL,
	"uncompressed_bytes" integer NOT NULL,
	"checksum_sha256" varchar(64) NOT NULL,
	"first_event_at" timestamp with time zone NOT NULL,
	"last_event_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_recording_chunks_bounds_check" CHECK ("tracking_recording_chunks"."sequence" >= 0
        and "tracking_recording_chunks"."event_count" > 0
        and "tracking_recording_chunks"."compressed_bytes" > 0
        and "tracking_recording_chunks"."uncompressed_bytes" > 0
        and "tracking_recording_chunks"."last_event_at" >= "tracking_recording_chunks"."first_event_at")
);
--> statement-breakpoint
CREATE TABLE "tracking_recording_object_deletions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_key" text NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_recording_object_deletions_attempts_check" CHECK ("tracking_recording_object_deletions"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "tracking_recording_usage_daily" (
	"workspace_id" uuid NOT NULL,
	"date" date NOT NULL,
	"recording_count" integer DEFAULT 0 NOT NULL,
	"compressed_bytes" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "tracking_recording_usage_daily_bounds_check" CHECK ("tracking_recording_usage_daily"."recording_count" >= 0 and "tracking_recording_usage_daily"."compressed_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "tracking_recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"recipient_id" uuid,
	"session_id" uuid NOT NULL,
	"public_session_id" varchar(160) NOT NULL,
	"status" "tracking_recording_status" DEFAULT 'pending' NOT NULL,
	"rrweb_version" varchar(40) DEFAULT '2.1.0' NOT NULL,
	"runtime_version" varchar(80) NOT NULL,
	"privacy_version" integer DEFAULT 1 NOT NULL,
	"visitor_notice_version" integer NOT NULL,
	"consent_granted_at" timestamp with time zone NOT NULL,
	"consent_source" varchar(20) NOT NULL,
	"upload_token_hash" varchar(128) NOT NULL,
	"max_duration_ms" integer NOT NULL,
	"max_chunk_bytes" integer NOT NULL,
	"max_events" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"compressed_bytes" integer DEFAULT 0 NOT NULL,
	"uncompressed_bytes" integer DEFAULT 0 NOT NULL,
	"object_prefix" text NOT NULL,
	"stop_reason" varchar(80),
	"final_sequence" integer,
	"error_code" varchar(80),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_recordings_bounds_check" CHECK ("tracking_recordings"."duration_ms" >= 0
        and "tracking_recordings"."event_count" >= 0
        and "tracking_recordings"."chunk_count" >= 0
        and "tracking_recordings"."compressed_bytes" >= 0
        and "tracking_recordings"."uncompressed_bytes" >= 0
        and "tracking_recordings"."max_duration_ms" between 60000 and 600000
        and "tracking_recordings"."max_chunk_bytes" between 1024 and 524288
        and "tracking_recordings"."max_events" between 1 and 20000
        and "tracking_recordings"."visitor_notice_version" > 0
        and "tracking_recordings"."consent_source" in ('prompt', 'remembered')
        and ("tracking_recordings"."final_sequence" is null or "tracking_recordings"."final_sequence" >= 0)
        and ("tracking_recordings"."ended_at" is null or "tracking_recordings"."ended_at" >= "tracking_recordings"."started_at"))
);
--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" DROP CONSTRAINT "tracking_recipient_sessions_duration_check";--> statement-breakpoint
ALTER TABLE "tracking_settings" DROP CONSTRAINT "tracking_settings_retention_check";--> statement-breakpoint
ALTER TABLE "sites" ALTER COLUMN "draft_content" SET DEFAULT '{"schemaVersion":3,"themeMode":"dark","settings":{"allowSearchIndexing":false,"siteTitle":"","siteDescription":"","primaryColor":"neutral","trackingConsentPopup":"popup-a"},"variables":[{"id":"recipient_website","key":"website","label":"Website","type":"url","description":"The recipient company''s website.","defaultValue":""}],"pages":[{"id":"page-overview","name":"Untitled Handout","slug":"untitled-handout","status":"visible","sortOrder":0,"document":{"type":"doc","content":[{"type":"paragraph"}]}}],"sidebar":{"sections":{"tabs":{"label":"Tabs"},"links":{"label":"Links"},"nextSteps":{"label":"Next steps"}},"links":[],"nextSteps":[]}}'::jsonb;--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD COLUMN "recording_status" "tracking_recording_status" DEFAULT 'disabled' NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD COLUMN "recording_duration_ms" integer;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "recording_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "recording_retention_days" integer DEFAULT 14 NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "max_recording_duration_seconds" integer DEFAULT 600 NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "recording_terms_version" varchar(40);--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "recording_terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "recording_terms_accepted_by_user_id" varchar(191);--> statement-breakpoint
ALTER TABLE "tracking_recording_chunks" ADD CONSTRAINT "tracking_recording_chunks_recording_id_tracking_recordings_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."tracking_recordings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recording_chunks" ADD CONSTRAINT "tracking_recording_chunks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recording_chunks" ADD CONSTRAINT "trk_recording_chunks_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tracking_recipient_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recording_usage_daily" ADD CONSTRAINT "tracking_recording_usage_daily_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recordings" ADD CONSTRAINT "tracking_recordings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recordings" ADD CONSTRAINT "tracking_recordings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recordings" ADD CONSTRAINT "tracking_recordings_recipient_id_site_variants_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."site_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recordings" ADD CONSTRAINT "trk_recordings_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tracking_recipient_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_recording_chunks_recording_sequence_idx" ON "tracking_recording_chunks" USING btree ("recording_id","sequence");--> statement-breakpoint
CREATE INDEX "tracking_recording_chunks_workspace_received_idx" ON "tracking_recording_chunks" USING btree ("workspace_id","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_recording_object_deletions_object_key_idx" ON "tracking_recording_object_deletions" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "tracking_recording_object_deletions_created_idx" ON "tracking_recording_object_deletions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_recording_usage_daily_workspace_date_idx" ON "tracking_recording_usage_daily" USING btree ("workspace_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_recordings_session_unique_idx" ON "tracking_recordings" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "tracking_recordings_workspace_started_idx" ON "tracking_recordings" USING btree ("workspace_id","started_at");--> statement-breakpoint
CREATE INDEX "tracking_recordings_status_expires_idx" ON "tracking_recordings" USING btree ("status","expires_at");--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD CONSTRAINT "tracking_settings_recording_terms_accepted_by_user_id_user_id_fk" FOREIGN KEY ("recording_terms_accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_recipient_sessions" ADD CONSTRAINT "tracking_recipient_sessions_duration_check" CHECK ("tracking_recipient_sessions"."active_ms" >= 0
        and ("tracking_recipient_sessions"."duration_ms" is null or "tracking_recipient_sessions"."duration_ms" >= 0)
        and ("tracking_recipient_sessions"."recording_duration_ms" is null or "tracking_recipient_sessions"."recording_duration_ms" between 0 and 600000));--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD CONSTRAINT "tracking_settings_recording_terms_check" CHECK ("tracking_settings"."recording_enabled" = false or (
        "tracking_settings"."enabled" = true
        and
        "tracking_settings"."recording_terms_version" is not null
        and "tracking_settings"."recording_terms_accepted_at" is not null
      ));--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD CONSTRAINT "tracking_settings_retention_check" CHECK ("tracking_settings"."event_retention_days" in (30, 90, 180, 365)
        and "tracking_settings"."recording_retention_days" in (7, 14, 30)
        and "tracking_settings"."max_recording_duration_seconds" between 60 and 600);--> statement-breakpoint
CREATE OR REPLACE FUNCTION "enqueue_tracking_recording_object_deletion"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "tracking_recording_object_deletions" ("object_key")
  VALUES (OLD."object_key")
  ON CONFLICT ("object_key") DO NOTHING;
  RETURN OLD;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "tracking_recording_chunks_enqueue_object_deletion"
BEFORE DELETE ON "tracking_recording_chunks"
FOR EACH ROW
EXECUTE FUNCTION "enqueue_tracking_recording_object_deletion"();
