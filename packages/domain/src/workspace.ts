export const WORKSPACE_STATUSES = [
  "active",
  "suspended",
  "scheduled_for_deletion",
  "deleted",
] as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export function canServeWorkspacePublicPages(status: WorkspaceStatus): boolean {
  return status === "active";
}

export function canMutateWorkspaceContent(status: WorkspaceStatus): boolean {
  return status === "active";
}
