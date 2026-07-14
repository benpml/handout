import type {
  SiteContent,
  SitePrimaryColor,
  SiteTrackingConsentPopup,
  SiteVariableDefinition,
  TiptapNode,
} from "@handout/site-document"

export const SYSTEM_SITE_VARIABLE_IDS = new Set([
  "recipient-name",
  "recipient-company",
  "recipient_website",
])

export const systemSiteVariables: SiteVariableDefinition[] = [
  {
    id: "recipient-name",
    key: "name",
    label: "Name",
    type: "text",
    description: "Recipient’s first name",
    defaultValue: "you",
  },
  {
    id: "recipient-company",
    key: "company",
    label: "Company",
    type: "text",
    description: "Recipient’s company name",
    defaultValue: "your company",
  },
  {
    id: "recipient_website",
    key: "website",
    label: "Website",
    type: "url",
    description: "Recipient’s company website",
    defaultValue: "",
  },
]

export const primaryColorOptions: Array<{
  className: string
  label: string
  value: SitePrimaryColor
}> = [
  { value: "neutral", label: "Neutral", className: "bg-foreground" },
  { value: "purple", label: "Purple", className: "bg-purple-foreground" },
  { value: "blue", label: "Blue", className: "bg-blue-foreground" },
  { value: "cyan", label: "Cyan", className: "bg-cyan-foreground" },
  { value: "teal", label: "Teal", className: "bg-teal-foreground" },
  { value: "green", label: "Green", className: "bg-green-foreground" },
  { value: "yellow", label: "Yellow", className: "bg-yellow-foreground" },
  { value: "orange", label: "Orange", className: "bg-orange-foreground" },
  { value: "red", label: "Red", className: "bg-red-foreground" },
  { value: "pink", label: "Pink", className: "bg-pink-foreground" },
]

export const trackingConsentOptions: Array<{
  description: string
  label: string
  value: SiteTrackingConsentPopup
}> = [
  { value: "popup-a", label: "Text decline", description: "Allow button with a text decline option." },
  { value: "popup-b", label: "Equal choices", description: "Equal allow and deny buttons." },
  {
    value: "none",
    label: "None",
    description: "Use only when session replay is off.",
  },
]

export function getSiteVariableUsageCounts(content: SiteContent) {
  const counts: Record<string, number> = {}

  for (const page of content.pages) {
    visitNode(page.document, (node) => {
      if (node.type !== "variableToken") return
      const variableId = node.attrs?.variableId
      if (typeof variableId !== "string" || !variableId) return
      counts[variableId] = (counts[variableId] ?? 0) + 1
    })
  }

  return counts
}

function visitNode(node: TiptapNode, visitor: (node: TiptapNode) => void) {
  visitor(node)
  node.content?.forEach((child) => visitNode(child, visitor))
}
