import type { WorkspacePlan } from "@handout/contracts"
import type { SiteContent, SiteVariableDefinition } from "@handout/site-document"

import { SiteSettingsDrawer } from "@/features/site-settings/components/site-settings-drawer"

type VariableInput = Pick<SiteVariableDefinition, "defaultValue" | "description" | "label">

export type EditorSiteSettingsMenuProps = {
  canManageTracking: boolean
  content: SiteContent
  onChange: (content: SiteContent) => void
  onCreateVariable: (input: VariableInput) => void
  onDeleteVariable: (variableId: string) => void
  onEditVariable: (variableId: string, input: VariableInput) => void
  plan: WorkspacePlan
  siteId: string
  usageCounts: Readonly<Record<string, number>>
  variables: SiteVariableDefinition[]
  workspaceId: string
}

export function EditorSiteSettingsMenu(props: EditorSiteSettingsMenuProps) {
  return <SiteSettingsDrawer {...props} />
}
