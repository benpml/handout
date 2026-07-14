import { and, asc, eq, sql } from "drizzle-orm";
import type { Database } from "@handout/db";
import { trackingInternalIpRanges } from "@handout/db/schema";

export type TrackingInternalIpRangeMatch = {
  id: string;
  workspaceId: string;
  label: string;
  ipRange: string;
};

export type TrackingInternalIpRangeRecord = TrackingInternalIpRangeMatch & {
  enabled: boolean;
  createdAt: Date;
};

export interface TrackingSuppressionRepository {
  findMatchingInternalIpRange(input: {
    workspaceId: string;
    ipAddress: string;
  }): Promise<TrackingInternalIpRangeMatch | null>;
  listInternalIpRanges(workspaceId: string): Promise<TrackingInternalIpRangeRecord[]>;
  upsertInternalIpRange(input: {
    workspaceId: string;
    userId: string;
    label: string;
    ipRange: string;
    now: Date;
  }): Promise<TrackingInternalIpRangeRecord>;
  deleteInternalIpRange(input: { workspaceId: string; id: string }): Promise<boolean>;
}

export interface TrackingSuppressionService {
  evaluateRecipientVisit(input: {
    workspaceId: string;
    ipAddress: string | null;
  }): Promise<{
    suppressed: boolean;
    reason: "internal_ip_range" | null;
    internalIpRange: TrackingInternalIpRangeMatch | null;
  }>;
  listInternalIpRanges(workspaceId: string): Promise<TrackingInternalIpRangeRecord[]>;
  upsertInternalIpRange(input: {
    workspaceId: string;
    userId: string;
    label: string;
    ipRange: string;
    now: Date;
  }): Promise<TrackingInternalIpRangeRecord>;
  deleteInternalIpRange(input: { workspaceId: string; id: string }): Promise<boolean>;
}

export function createDbTrackingSuppressionRepository(database: Database): TrackingSuppressionRepository {
  return {
    async findMatchingInternalIpRange(input) {
      const [row] = await database
        .select({
          id: trackingInternalIpRanges.id,
          workspaceId: trackingInternalIpRanges.workspaceId,
          label: trackingInternalIpRanges.label,
          ipRange: trackingInternalIpRanges.ipRange,
        })
        .from(trackingInternalIpRanges)
        .where(and(
          eq(trackingInternalIpRanges.workspaceId, input.workspaceId),
          eq(trackingInternalIpRanges.enabled, true),
          sql`${input.ipAddress}::inet <<= ${trackingInternalIpRanges.ipRange}`,
        ))
        .limit(1);
      return row ?? null;
    },
    async listInternalIpRanges(workspaceId) {
      return database.select({
        id: trackingInternalIpRanges.id,
        workspaceId: trackingInternalIpRanges.workspaceId,
        label: trackingInternalIpRanges.label,
        ipRange: trackingInternalIpRanges.ipRange,
        enabled: trackingInternalIpRanges.enabled,
        createdAt: trackingInternalIpRanges.createdAt,
      }).from(trackingInternalIpRanges)
        .where(eq(trackingInternalIpRanges.workspaceId, workspaceId))
        .orderBy(asc(trackingInternalIpRanges.createdAt), asc(trackingInternalIpRanges.id));
    },
    async upsertInternalIpRange(input) {
      const [record] = await database.insert(trackingInternalIpRanges).values({
        workspaceId: input.workspaceId,
        ipRange: input.ipRange,
        label: input.label,
        enabled: true,
        createdByUserId: input.userId,
        createdAt: input.now,
        updatedAt: input.now,
      }).onConflictDoUpdate({
        target: [trackingInternalIpRanges.workspaceId, trackingInternalIpRanges.ipRange],
        set: { label: input.label, enabled: true, updatedAt: input.now },
      }).returning({
        id: trackingInternalIpRanges.id,
        workspaceId: trackingInternalIpRanges.workspaceId,
        label: trackingInternalIpRanges.label,
        ipRange: trackingInternalIpRanges.ipRange,
        enabled: trackingInternalIpRanges.enabled,
        createdAt: trackingInternalIpRanges.createdAt,
      });
      if (!record) throw new Error("Internal IP range upsert did not return a row.");
      return record;
    },
    async deleteInternalIpRange(input) {
      const deleted = await database.delete(trackingInternalIpRanges).where(and(
        eq(trackingInternalIpRanges.workspaceId, input.workspaceId),
        eq(trackingInternalIpRanges.id, input.id),
      )).returning({ id: trackingInternalIpRanges.id });
      return deleted.length === 1;
    },
  };
}

export function createTrackingSuppressionService(input: {
  repository: TrackingSuppressionRepository;
}): TrackingSuppressionService {
  return {
    async evaluateRecipientVisit(visit) {
      const internalIpRange = visit.ipAddress
        ? await input.repository.findMatchingInternalIpRange({
            workspaceId: visit.workspaceId,
            ipAddress: visit.ipAddress,
          })
        : null;
      return {
        suppressed: internalIpRange !== null,
        reason: internalIpRange ? "internal_ip_range" : null,
        internalIpRange,
      };
    },
    listInternalIpRanges: (workspaceId) => input.repository.listInternalIpRanges(workspaceId),
    upsertInternalIpRange: (range) => input.repository.upsertInternalIpRange(range),
    deleteInternalIpRange: (range) => input.repository.deleteInternalIpRange(range),
  };
}

export function createMemoryTrackingSuppressionRepository(input: {
  ranges?: TrackingInternalIpRangeMatch[];
  matches?: (ipAddress: string, ipRange: string) => boolean;
} = {}): TrackingSuppressionRepository {
  const ranges: TrackingInternalIpRangeRecord[] = (input.ranges ?? []).map((range) => ({
    ...range,
    enabled: true,
    createdAt: new Date(0),
  }));
  return {
    async findMatchingInternalIpRange({ workspaceId, ipAddress }) {
      return ranges.find((range) =>
        range.workspaceId === workspaceId && (input.matches?.(ipAddress, range.ipRange) ?? ipAddress === range.ipRange)
      ) ?? null;
    },
    async listInternalIpRanges(workspaceId) {
      return ranges.filter((range) => range.workspaceId === workspaceId);
    },
    async upsertInternalIpRange(range) {
      const existing = ranges.find((candidate) => candidate.workspaceId === range.workspaceId && candidate.ipRange === range.ipRange);
      if (existing) {
        existing.label = range.label;
        existing.enabled = true;
        return existing;
      }
      const record: TrackingInternalIpRangeRecord = {
        id: `00000000-0000-4000-8000-${String(ranges.length + 1).padStart(12, "0")}`,
        workspaceId: range.workspaceId,
        label: range.label,
        ipRange: range.ipRange,
        enabled: true,
        createdAt: range.now,
      };
      ranges.push(record);
      return record;
    },
    async deleteInternalIpRange({ workspaceId, id }) {
      const index = ranges.findIndex((range) => range.workspaceId === workspaceId && range.id === id);
      if (index < 0) return false;
      ranges.splice(index, 1);
      return true;
    },
  };
}
