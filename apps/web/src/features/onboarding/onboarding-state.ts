import type { AppBootstrapResponse } from "@handout/contracts"
import { validateWorkEmail } from "@handout/domain"

export type OnboardingStep = "verify_email" | "account" | "workspace"

export function resolveOnboardingStep(bootstrap: AppBootstrapResponse): OnboardingStep | "app" {
  switch (bootstrap.onboarding.nextStep) {
    case "verify_email":
      return "verify_email"
    case "account_setup":
      return "account"
    case "workspace_setup":
    case "invite_acceptance":
      return "workspace"
    case "app":
      return "app"
  }
}

export function getDefaultAccountName(bootstrap: AppBootstrapResponse) {
  const existingName = bootstrap.user.name?.trim()

  if (existingName) {
    return existingName
  }

  return bootstrap.user.email.split("@")[0]?.replace(/[._-]+/g, " ").trim() ?? ""
}

export function getDefaultWorkspaceName(email: string) {
  const validation = validateWorkEmail(email)

  if (!validation.ok) {
    return "My Workspace"
  }

  const companyLabel = validation.domain.split(".")[0]?.replace(/[-_]+/g, " ").trim()

  if (!companyLabel) {
    return "My Workspace"
  }

  return companyLabel
    .split(/\s+/)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ")
}
