import { useId, useRef, type CSSProperties, type Ref } from "react"
import {
  IconBraces,
  IconCheck,
  IconDeviceDesktop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"
import type { SiteContent, SiteVariableDefinition } from "@handout/site-document"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import {
  primaryColorOptions,
  SYSTEM_SITE_VARIABLE_IDS,
  systemSiteVariables,
} from "../model"

type AppearanceSettingsProps = {
  content: SiteContent
  onChange: (content: SiteContent) => void
  variables: SiteVariableDefinition[]
}

const modeOptions = [
  { value: "light", label: "Light", description: "Always light mode", icon: IconSun },
  { value: "dark", label: "Dark", description: "Always dark mode", icon: IconMoon },
  {
    value: "system",
    label: "Automatic",
    description: "Follow the users system theme",
    icon: IconDeviceDesktop,
  },
] as const

export function AppearanceSettings({ content, onChange, variables }: AppearanceSettingsProps) {
  const allVariables = mergeVariables(variables)
  const updateSettings = (settings: Partial<SiteContent["settings"]>) => {
    onChange({ ...content, settings: { ...content.settings, ...settings } })
  }

  return (
    <div className="flex flex-col gap-7 px-4 pb-4 pt-1">
      <FieldGroup className="gap-7">
        <VariableTemplateField
          label="Title"
          maxLength={160}
          onChange={(siteTitle) => updateSettings({ siteTitle })}
          value={content.settings.siteTitle}
          variables={allVariables}
        />
        <VariableTemplateField
          label="Description"
          maxLength={1000}
          multiline
          onChange={(siteDescription) => updateSettings({ siteDescription })}
          value={content.settings.siteDescription}
          variables={allVariables}
        />
      </FieldGroup>

      <Field>
        <FieldLabel>Mode</FieldLabel>
        <ToggleGroup
          aria-label="Site appearance mode"
          className="w-full gap-1.5"
          orientation="vertical"
          type="single"
          value={content.themeMode}
          variant="outline"
          onValueChange={(value) => {
            if (value === "light" || value === "dark" || value === "system") {
              onChange({ ...content, themeMode: value })
            }
          }}
        >
          {modeOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              aria-label={`${option.label}: ${option.description}`}
              className="h-auto w-full flex-col items-stretch overflow-hidden rounded-xl p-0 data-[state=on]:border-foreground data-[state=on]:bg-transparent"
              value={option.value}
            >
              <ModePreview mode={option.value} />
              <div className="flex items-center gap-2 px-3 py-2 text-left">
                <option.icon className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{option.label}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {option.description}
                  </span>
                </span>
                {content.themeMode === option.value ? <IconCheck className="size-4" /> : null}
              </div>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field>
        <FieldLabel>Primary color</FieldLabel>
        <ToggleGroup
          aria-label="Primary color"
          className="w-full justify-start gap-2.5"
          type="single"
          value={content.settings.primaryColor}
          onValueChange={(value) => {
            if (primaryColorOptions.some((option) => option.value === value)) {
              updateSettings({ primaryColor: value as SiteContent["settings"]["primaryColor"] })
            }
          }}
        >
          {primaryColorOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              aria-label={option.label}
              className="size-6 rounded-full p-0 data-[state=on]:ring-2 data-[state=on]:ring-foreground data-[state=on]:ring-offset-2 data-[state=on]:ring-offset-popover"
              value={option.value}
            >
              <span className={cn("size-full rounded-full", option.className)} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <PrimaryColorPreview color={content.settings.primaryColor} />
      </Field>
    </div>
  )
}

function VariableTemplateField({
  label,
  maxLength,
  multiline = false,
  onChange,
  value,
  variables,
}: {
  label: string
  maxLength: number
  multiline?: boolean
  onChange: (value: string) => void
  value: string
  variables: SiteVariableDefinition[]
}) {
  const id = useId()
  const controlRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const insertVariable = (variable: SiteVariableDefinition) => {
    const control = controlRef.current
    const token = `{{${variable.key}}}`
    const start = control?.selectionStart ?? value.length
    const end = control?.selectionEnd ?? value.length
    onChange(`${value.slice(0, start)}${token}${value.slice(end)}`)
    requestAnimationFrame(() => {
      control?.focus()
      control?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup className={multiline ? "min-h-20 items-start" : undefined}>
        {multiline ? (
          <InputGroupTextarea
            id={id}
            maxLength={maxLength}
            ref={controlRef as Ref<HTMLTextAreaElement>}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <InputGroupInput
            id={id}
            maxLength={maxLength}
            ref={controlRef as Ref<HTMLInputElement>}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
        <InputGroupAddon align="inline-end" className={multiline ? "self-start" : undefined}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton size="icon-xs" aria-label={`Insert a variable in ${label.toLowerCase()}`}>
                <IconBraces />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Insert recipient variable</DropdownMenuLabel>
              {variables.map((variable) => (
                <DropdownMenuItem key={variable.id} onSelect={() => insertVariable(variable)}>
                  <IconBraces />
                  {variable.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

function ModePreview({ mode }: { mode: (typeof modeOptions)[number]["value"] }) {
  const isDark = mode === "dark"
  const isAutomatic = mode === "system"

  return (
    <div className={cn("h-[100px] w-full p-3", isDark ? "bg-neutral-800" : isAutomatic ? "bg-gradient-to-r from-neutral-100 to-neutral-800" : "bg-neutral-100")}>
      <div className={cn(
        "grid h-full grid-cols-[36px_1fr] overflow-hidden rounded-md border shadow-sm",
        isDark
          ? "border-neutral-700 bg-neutral-900"
          : isAutomatic
            ? "border-neutral-400 bg-gradient-to-r from-neutral-50 from-50% to-neutral-900 to-50%"
            : "border-neutral-200 bg-neutral-50",
      )}>
        <div className={cn("border-r p-1.5", isDark ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-neutral-100")}>
          <div className={cn("mb-2 h-2 w-4 rounded-full", isDark ? "bg-neutral-300" : "bg-neutral-600")} />
          <div className={cn("mb-1 h-1.5 rounded-full", isDark ? "bg-neutral-600" : "bg-neutral-300")} />
          <div className={cn("h-1.5 rounded-full", isDark ? "bg-neutral-600" : "bg-neutral-300")} />
        </div>
        <div className="p-2">
          <div className={cn("mb-2 h-2 w-16 rounded-full", isDark ? "bg-neutral-200" : "bg-neutral-700")} />
          <div className={cn("mb-1 h-1.5 w-full rounded-full", isDark ? "bg-neutral-600" : "bg-neutral-300")} />
          <div className={cn("h-1.5 w-3/4 rounded-full", isDark ? "bg-neutral-600" : "bg-neutral-300")} />
        </div>
      </div>
    </div>
  )
}

function PrimaryColorPreview({ color }: { color: SiteContent["settings"]["primaryColor"] }) {
  const style = getPreviewColorStyle(color)

  return (
    <div className="mt-2.5 rounded-xl border bg-card p-3" style={style}>
      <div className="mb-3 flex gap-1 border-b pb-2">
        <span className="rounded-md bg-[var(--preview-soft)] px-2 py-1 text-xs font-medium text-[var(--preview-primary)]">
          Active tab
        </span>
        <span className="px-2 py-1 text-xs text-muted-foreground">Another tab</span>
      </div>
      <Button size="compact" className="bg-[var(--preview-primary)] text-[var(--preview-foreground)] hover:bg-[var(--preview-primary)]">
        Primary button
      </Button>
    </div>
  )
}

function getPreviewColorStyle(color: SiteContent["settings"]["primaryColor"]) {
  if (color === "neutral") {
    return {
      "--preview-primary": "var(--foreground)",
      "--preview-foreground": "var(--background)",
      "--preview-soft": "var(--accent)",
    } as CSSProperties
  }

  return {
    "--preview-primary": `var(--${color}-foreground)`,
    "--preview-foreground": "var(--background)",
    "--preview-soft": `var(--${color}-background)`,
  } as CSSProperties
}

function mergeVariables(variables: SiteVariableDefinition[]) {
  const byId = new Map(systemSiteVariables.map((variable) => [variable.id, variable]))
  variables.forEach((variable) => {
    if (!SYSTEM_SITE_VARIABLE_IDS.has(variable.id)) byId.set(variable.id, variable)
  })
  return [...byId.values()]
}
