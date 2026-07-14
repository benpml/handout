import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { CurrentActor } from "./current-actor";

export type AgentAuthContext = {
  actor: CurrentActor;
  workspace: {
    id: string;
    plan: "free" | "core" | "pro";
    role: "admin" | "user";
  };
};

export function getAgentAuthContext(request: Request): AgentAuthContext | null {
  const expectedToken = process.env.HANDOUT_AGENT_API_TOKEN;
  const workspaceId = process.env.HANDOUT_AGENT_WORKSPACE_ID;

  if (!expectedToken || !workspaceId) {
    return null;
  }

  const authorization = request.header("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token || !secureEquals(token, expectedToken)) {
    return null;
  }

  return {
    actor: {
      userId: process.env.HANDOUT_AGENT_USER_ID ?? "handout_agent",
      email: process.env.HANDOUT_AGENT_EMAIL ?? "agent@handout.app",
      emailVerified: true,
      name: process.env.HANDOUT_AGENT_NAME ?? "Handout Agent",
    },
    workspace: {
      id: workspaceId,
      plan: resolveAgentWorkspacePlan(),
      role: process.env.HANDOUT_AGENT_WORKSPACE_ROLE === "user" ? "user" : "admin",
    },
  };
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function resolveAgentWorkspacePlan(): AgentAuthContext["workspace"]["plan"] {
  const plan = process.env.HANDOUT_AGENT_WORKSPACE_PLAN;

  return plan === "free" || plan === "pro" ? plan : "core";
}
