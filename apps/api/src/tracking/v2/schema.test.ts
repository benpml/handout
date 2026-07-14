import { trackingRecipientEvents } from "@handout/db/schema";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

describe("tracking v2 database invariants", () => {
  it("deletes session-scoped browser events with their session", () => {
    const sessionForeignKey = getTableConfig(trackingRecipientEvents).foreignKeys.find(
      (foreignKey) => foreignKey.getName() === "trk_rec_events_session_fk",
    );

    expect(sessionForeignKey?.onDelete).toBe("cascade");
  });
});
