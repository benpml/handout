import {
  createWorkspaceInvitationRequestSchema,
  createWorkspaceInvitationResponseSchema,
  updateWorkspaceMemberRequestSchema,
  updateWorkspaceMemberResponseSchema,
  workspaceTeamResponseSchema,
  type CreateWorkspaceInvitationRequest,
  type UpdateWorkspaceMemberRequest,
} from "@handout/contracts"

import { apiRequest } from "@/lib/api/client"

export function getWorkspaceTeam(workspaceId: string, signal?: AbortSignal) {
  return apiRequest(`/api/workspaces/${workspaceId}/team`, {
    responseSchema: workspaceTeamResponseSchema,
    signal,
  })
}

export function inviteWorkspaceMember(
  workspaceId: string,
  input: CreateWorkspaceInvitationRequest,
) {
  return apiRequest(`/api/workspaces/${workspaceId}/team/invitations`, {
    method: "POST",
    body: createWorkspaceInvitationRequestSchema.parse(input),
    responseSchema: createWorkspaceInvitationResponseSchema,
  })
}

export function updateWorkspaceMember(
  workspaceId: string,
  memberId: string,
  input: UpdateWorkspaceMemberRequest,
) {
  return apiRequest(`/api/workspaces/${workspaceId}/team/members/${memberId}`, {
    method: "PATCH",
    body: updateWorkspaceMemberRequestSchema.parse(input),
    responseSchema: updateWorkspaceMemberResponseSchema,
  })
}

export function removeWorkspaceMember(workspaceId: string, memberId: string) {
  return apiRequest(`/api/workspaces/${workspaceId}/team/members/${memberId}`, {
    method: "DELETE",
  })
}

export function revokeWorkspaceInvitation(workspaceId: string, invitationId: string) {
  return apiRequest(`/api/workspaces/${workspaceId}/team/invitations/${invitationId}`, {
    method: "DELETE",
  })
}
