import { PrimitiveGallery } from "./primitive-gallery"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const colorTokens = [
  { name: "background", className: "bg-background", textClassName: "text-foreground" },
  { name: "page-background", className: "bg-page-background", textClassName: "text-foreground" },
  { name: "card", className: "bg-card", textClassName: "text-card-foreground" },
  { name: "primary", className: "bg-primary", textClassName: "text-primary-foreground" },
  { name: "secondary", className: "bg-secondary", textClassName: "text-secondary-foreground" },
  { name: "muted", className: "bg-muted", textClassName: "text-muted-foreground" },
  { name: "accent", className: "bg-accent", textClassName: "text-accent-foreground" },
  { name: "destructive", className: "bg-destructive", textClassName: "text-primary-foreground" },
  { name: "variable-background", className: "bg-variable-background", textClassName: "text-variable-foreground" },
  {
    name: "variable-background-secondary",
    className: "bg-variable-background-secondary",
    textClassName: "text-variable-foreground",
  },
  { name: "editing-background", className: "bg-editing-background", textClassName: "text-editing-foreground-hover" },
  { name: "editing-foreground", className: "bg-editing-foreground", textClassName: "text-foreground" },
]

const radiusTokens = [
  { name: "xs", className: "rounded-xs" },
  { name: "sm", className: "rounded-sm" },
  { name: "md", className: "rounded-md" },
  { name: "lg", className: "rounded-lg" },
  { name: "xl", className: "rounded-xl" },
  { name: "2xl", className: "rounded-2xl" },
]

export function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-normal">Design system</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Lightsite starts from shadcn primitives, a neutral token set, and compact sales-workflow
          patterns. This page is the local visual baseline for future app-specific components.
        </p>
      </section>
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Tokens</h2>
          <p className="text-sm text-muted-foreground">
            Figma mode variables mapped into Tailwind classes for app and editor surfaces.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {colorTokens.map((token) => (
            <Card key={token.name}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className={`size-10 shrink-0 rounded-md border ${token.className}`} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{token.name}</div>
                  <div className={`truncate text-xs ${token.textClassName}`}>Aa token</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Radius</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {radiusTokens.map((token) => (
              <div key={token.name} className="flex items-center gap-3">
                <div className={`size-10 border bg-card ${token.className}`} />
                <span className="text-sm text-muted-foreground">{token.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <PrimitiveGallery />
    </div>
  )
}
