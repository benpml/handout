import { IconCheck } from "@tabler/icons-react"

import { componentNames } from "@/data/sample-data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ComponentIndexPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Components</h1>
        <p className="text-sm text-muted-foreground">
          Base shadcn primitives installed into `src/components/ui` and ready for product composition.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {componentNames.map((name) => (
          <Card key={name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm">{name}</CardTitle>
                <Badge variant="secondary">
                  <IconCheck />
                  Imported
                </Badge>
              </div>
              <CardDescription>shadcn radix-nova base</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Compose this primitive before creating app-specific UI.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
