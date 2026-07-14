ALTER TABLE "tracking_recipient_events" DROP CONSTRAINT "trk_rec_events_session_fk";
--> statement-breakpoint
ALTER TABLE "tracking_recipient_events" ADD CONSTRAINT "trk_rec_events_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tracking_recipient_sessions"("id") ON DELETE cascade ON UPDATE no action;