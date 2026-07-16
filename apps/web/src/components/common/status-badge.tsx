import { Badge } from "@/components/ui/badge"
import type { SiteStatus, WorkspaceInvitationStatus, WorkspaceRole } from "@handout/contracts"

type SiteStatusBadgeProps = {
  status: SiteStatus
  hasUnpublishedChanges?: boolean
}

export function SiteStatusBadge({ status, hasUnpublishedChanges }: SiteStatusBadgeProps) {
  if (status === "published" && hasUnpublishedChanges) {
    return <Badge variant="secondary">Unpublished changes</Badge>
  }

  if (status === "published") {
    return <Badge>Published</Badge>
  }

  if (status === "archived") {
    return <Badge variant="outline">Archived</Badge>
  }

  return <Badge variant="secondary">{getSiteStatusLabel(status)}</Badge>
}

export function RoleBadge({ role }: { role: WorkspaceRole }) {
  return (
    <Badge variant={role === "admin" ? "default" : "secondary"}>
      {getRoleLabel(role)}
    </Badge>
  )
}

export function InviteStatusBadge({ status }: { status: WorkspaceInvitationStatus }) {
  if (status === "expired") {
    return <Badge variant="outline">Expired</Badge>
  }

  return <Badge variant="secondary">Pending</Badge>
}

function getSiteStatusLabel(status: SiteStatus) {
  if (status === "published") {
    return "Published"
  }

  if (status === "archived") {
    return "Archived"
  }

  return "Draft"
}

function getRoleLabel(role: WorkspaceRole) {
  return role === "admin" ? "Admin" : "User"
}
