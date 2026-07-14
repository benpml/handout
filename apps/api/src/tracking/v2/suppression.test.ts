import { describe, expect, it, vi } from "vitest";
import {
  createMemoryTrackingSuppressionRepository,
  createTrackingSuppressionService,
  type TrackingSuppressionRepository,
} from "./suppression";

const workspaceId = "11111111-1111-4111-8111-111111111111";

describe("tracking internal-network suppression", () => {
  it("suppresses only a matching enabled workspace range", async () => {
    const repository = createMemoryTrackingSuppressionRepository({
      ranges: [{
        id: "22222222-2222-4222-8222-222222222222",
        workspaceId,
        label: "Office",
        ipRange: "203.0.113.8",
      }],
    });
    const service = createTrackingSuppressionService({ repository });

    await expect(service.evaluateRecipientVisit({ workspaceId, ipAddress: "203.0.113.8" })).resolves.toMatchObject({
      suppressed: true,
      reason: "internal_ip_range",
      internalIpRange: { label: "Office" },
    });
    await expect(service.evaluateRecipientVisit({ workspaceId, ipAddress: "203.0.113.9" })).resolves.toEqual({
      suppressed: false,
      reason: null,
      internalIpRange: null,
    });
  });

  it("does not query storage when no valid request IP is available", async () => {
    const findMatchingInternalIpRange = vi.fn<TrackingSuppressionRepository["findMatchingInternalIpRange"]>();
    const service = createTrackingSuppressionService({ repository: {
      findMatchingInternalIpRange,
      listInternalIpRanges: async () => [],
      upsertInternalIpRange: async () => { throw new Error("Not used in this test."); },
      deleteInternalIpRange: async () => false,
    } });

    await expect(service.evaluateRecipientVisit({ workspaceId, ipAddress: null })).resolves.toEqual({
      suppressed: false,
      reason: null,
      internalIpRange: null,
    });
    expect(findMatchingInternalIpRange).not.toHaveBeenCalled();
  });
});
