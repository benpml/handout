import {
  IconCodeAsterisk,
  IconDotsVertical,
  IconPalette,
  IconScanPosition,
  IconX,
} from "@tabler/icons-react"
import type { ReactNode, SetStateAction } from "react"
import type { WorkspacePlan } from "@handout/contracts"
import type { SiteContent, SiteVariableDefinition } from "@handout/site-document"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { AppearanceSettings } from "./appearance-settings"
import { TrackingSettings } from "./tracking-settings"
import { VariablesSettings } from "./variables-settings"

type VariableInput = Pick<SiteVariableDefinition, "defaultValue" | "description" | "label">

export type SiteSettingsDrawerProps = {
  canManageTracking: boolean
  content: SiteContent
  onChange: (content: SetStateAction<SiteContent>) => void
  onCreateVariable: (input: VariableInput) => void
  onDeleteVariable: (variableId: string) => void
  onEditVariable: (variableId: string, input: VariableInput) => void
  plan: WorkspacePlan
  siteId: string
  siteName: string
  usageCounts: Readonly<Record<string, number>>
  variables: SiteVariableDefinition[]
  workspaceId: string
}

export function SiteSettingsDrawer({
  canManageTracking,
  content,
  onChange,
  onCreateVariable,
  onDeleteVariable,
  onEditVariable,
  plan,
  siteId,
  siteName,
  usageCounts,
  variables,
  workspaceId,
}: SiteSettingsDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-compact" aria-label="Site settings" title="Site settings">
          <IconDotsVertical />
        </Button>
      </SheetTrigger>
      <SheetContent
        aria-describedby={undefined}
        className="inset-y-1.5! right-1.5! h-[calc(100%-12px)]! w-[384px] max-w-[calc(100vw-12px)] gap-5 overflow-hidden rounded-2xl border-0 bg-background px-4 pt-2 pb-4 sm:max-w-[384px]"
        overlayClassName="bg-black/20 backdrop-blur-none"
        showCloseButton={false}
      >
        <SheetHeader className="flex h-8 shrink-0 flex-row items-center justify-between rounded-sm px-1.5 py-1.5">
          <SheetTitle className="text-sm leading-5">Site settings</SheetTitle>
          <SheetClose asChild>
            <Button className="-mr-1.5" variant="ghost" size="icon-field" aria-label="Close site settings">
              <IconX />
            </Button>
          </SheetClose>
        </SheetHeader>
        <Tabs defaultValue="appearance" className="min-h-0 flex-1 gap-5">
          <TabsList variant="line" className="h-[42px]! w-full shrink-0 justify-start gap-2 border-b border-border-subtle p-0">
            <TabsTrigger value="appearance" className="h-full! flex-none -translate-y-0.5 px-1 after:bottom-[-3px]! after:h-px! [&_svg:not([class*='size-'])]:size-3.5">
              <IconPalette data-icon="inline-start" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="tracking" className="h-full! flex-none -translate-y-0.5 px-1 after:bottom-[-3px]! after:h-px! [&_svg:not([class*='size-'])]:size-3.5">
              <IconScanPosition data-icon="inline-start" />
              Tracking
            </TabsTrigger>
            <TabsTrigger value="variables" className="h-full! flex-none -translate-y-0.5 px-1 after:bottom-[-3px]! after:h-px! [&_svg:not([class*='size-'])]:size-3.5">
              <IconCodeAsterisk data-icon="inline-start" />
              Variables
            </TabsTrigger>
          </TabsList>
          <SettingsTab value="appearance">
            <AppearanceSettings
              content={content}
              onChange={onChange}
              siteName={siteName}
              variables={variables}
            />
          </SettingsTab>
          <SettingsTab value="tracking">
            <TrackingSettings
              canManage={canManageTracking}
              content={content}
              onChange={onChange}
              plan={plan}
              siteId={siteId}
              workspaceId={workspaceId}
            />
          </SettingsTab>
          <SettingsTab value="variables">
            <VariablesSettings
              onCreate={onCreateVariable}
              onDelete={onDeleteVariable}
              onEdit={onEditVariable}
              usageCounts={usageCounts}
              variables={variables}
            />
          </SettingsTab>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function SettingsTab({ children, value }: { children: ReactNode; value: string }) {
  return (
    <TabsContent value={value} className="min-h-0">
      <ScrollArea className="h-full">
        <div className="px-px">{children}</div>
      </ScrollArea>
    </TabsContent>
  )
}
