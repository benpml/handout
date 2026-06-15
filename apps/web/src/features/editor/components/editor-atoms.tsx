import { useState, type ReactNode } from "react"
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core"
import {
  IconCodePlus,
  IconChevronLeft,
  IconLink,
  IconGripVertical,
  IconPhoto,
  IconVariable,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  createEditorVariable,
  formatVariableToken,
  normalizeVariableKey,
  type EditorVariable,
  type EditorVariableType,
} from "../editor-data"

type VariableChipProps = {
  children: ReactNode
  className?: string
}

export function VariableChip({ children, className }: VariableChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[19px] items-center rounded-md bg-variable-background px-1 text-xs font-medium leading-4 text-variable-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}

type EditableBlockFrameProps = {
  selected?: boolean
  preview?: boolean
  blockType?: string
  className?: string
  children: ReactNode
  onClick?: () => void
  dragAttributes?: DraggableAttributes
  dragListeners?: DraggableSyntheticListeners
}

export function EditableBlockFrame({
  selected,
  preview,
  blockType,
  className,
  children,
  onClick,
  dragAttributes,
  dragListeners,
}: EditableBlockFrameProps) {
  return (
    <div
      data-editor-block-frame=""
      data-block-type={blockType}
      data-selected={selected ? true : undefined}
      {...(!preview ? dragAttributes : undefined)}
      {...(!preview ? dragListeners : undefined)}
      className={cn(
        "group/editor-block relative block w-full rounded-lg text-left transition-colors outline-none",
        !preview &&
          "hover:bg-editing-background focus-visible:ring-3 focus-visible:ring-ring/50 data-selected:bg-editing-background data-selected:ring-1 data-selected:ring-editing-foreground-hover data-[block-type=heading]:data-selected:ring-0 data-[block-type=text]:data-selected:ring-0 data-[block-type=title]:data-selected:ring-0 focus-within:ring-0",
        className
      )}
      onClick={onClick}
    >
      {!preview ? (
        <button
          type="button"
          className="absolute top-1/2 -left-5 flex h-6 w-4 -translate-y-1/2 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground active:cursor-grabbing group-hover/editor-block:opacity-100 [&_svg]:size-3.5"
          aria-label="Drag block"
        >
          <IconGripVertical />
        </button>
      ) : null}
      {children}
    </div>
  )
}

export function VariableButton({
  allowedTypes = ["text"],
  label = "Add variable",
  onCreateVariable,
  onSelect,
  variables,
}: {
  allowedTypes?: EditorVariableType[]
  label?: string
  onCreateVariable: (variable: EditorVariable) => void
  onSelect?: (variableName: string) => void
  variables: EditorVariable[]
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"list" | "new">("list")
  const [newVariableName, setNewVariableName] = useState("")
  const [newVariableDefault, setNewVariableDefault] = useState("")
  const [selectedType, setSelectedType] = useState<EditorVariableType>(allowedTypes[0] ?? "text")
  const [keyError, setKeyError] = useState<string | null>(null)
  const availableVariables = variables.filter((variable) => allowedTypes.includes(variable.type))
  const activeSelectedType = allowedTypes.includes(selectedType)
    ? selectedType
    : (allowedTypes[0] ?? "text")

  function handleSelect(variable: EditorVariable) {
    onSelect?.(formatVariableToken(variable))
    setOpen(false)
    setStep("list")
  }

  function handleCreateVariable() {
    const normalizedKey = normalizeVariableKey(newVariableName)

    if (!normalizedKey) {
      setKeyError("Use a lowercase key like company_name.")
      return
    }

    if (variables.some((variable) => variable.key === normalizedKey)) {
      setKeyError("A variable with this key already exists.")
      return
    }

    const variable = createEditorVariable({
      defaultValue: newVariableDefault,
      key: normalizedKey,
      type: activeSelectedType,
    })

    onCreateVariable(variable)
    handleSelect(variable)
    setNewVariableName("")
    setNewVariableDefault("")
    setKeyError(null)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setStep("list")
          setKeyError(null)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon-field" aria-label={label}>
          <IconVariable />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-72 gap-0 p-1">
        {step === "list" ? (
          <>
            <div className="flex h-10 items-center px-2 text-sm font-medium">
              Variables
            </div>
            <div className="flex flex-col gap-0.5">
              {availableVariables.map((variable) => (
                <button
                  key={variable.id}
                  type="button"
                  className="flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                  onClick={() => handleSelect(variable)}
                >
                  <VariableTypeIcon type={variable.type} />
                  <VariableChip>{formatVariableToken(variable)}</VariableChip>
                  <Badge variant="outline" className="ml-auto">
                    {variable.type}
                  </Badge>
                </button>
              ))}
              {availableVariables.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  No variables for this field yet.
                </div>
              ) : null}
            </div>
            <div className="mt-1 p-1">
              <Button
                variant="outline"
                size="compact"
                className="w-full"
                onClick={() => setStep("new")}
              >
                <IconCodePlus data-icon="inline-start" />
                New variable
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-10 items-center gap-1 px-1">
              <Button variant="ghost" size="icon-field" aria-label="Back to variables" onClick={() => setStep("list")}>
                <IconChevronLeft />
              </Button>
              <span className="text-sm font-medium">New variable</span>
            </div>
            <div className="p-2">
              <FieldGroup>
                <Field data-invalid={Boolean(keyError) || undefined}>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    value={newVariableName}
                    onChange={(event) => {
                      setNewVariableName(event.target.value)
                      setKeyError(null)
                    }}
                    placeholder="prospect_name"
                    aria-invalid={Boolean(keyError) || undefined}
                  />
                  {keyError ? <FieldError>{keyError}</FieldError> : null}
                </Field>
                {allowedTypes.length > 1 ? (
                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <ToggleGroup
                      type="single"
                      value={activeSelectedType}
                      onValueChange={(value) => {
                        if (isVariableType(value) && allowedTypes.includes(value)) {
                          setSelectedType(value)
                        }
                      }}
                      spacing={2}
                      className="grid grid-cols-3"
                    >
                      {allowedTypes.map((type) => (
                        <ToggleGroupItem key={type} value={type} variant="outline" className="h-8">
                          {type}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                ) : null}
                <Field>
                  <FieldLabel>Default value</FieldLabel>
                  {activeSelectedType === "image" ? (
                    <Input
                      value={newVariableDefault}
                      onChange={(event) => setNewVariableDefault(event.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  ) : activeSelectedType === "text" ? (
                    <Textarea
                      className="min-h-20 resize-none"
                      value={newVariableDefault}
                      onChange={(event) => setNewVariableDefault(event.target.value)}
                      placeholder="Optional fallback text"
                    />
                  ) : (
                    <Input
                      value={newVariableDefault}
                      onChange={(event) => setNewVariableDefault(event.target.value)}
                      placeholder="https://example.com"
                    />
                  )}
                </Field>
              </FieldGroup>
            </div>
            <div className="p-1">
              <Button size="compact" className="w-full" onClick={handleCreateVariable}>
                Insert
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

function VariableTypeIcon({ type }: { type: EditorVariableType }) {
  if (type === "image") {
    return <IconPhoto />
  }

  if (type === "url") {
    return <IconLink />
  }

  return <IconVariable />
}

function isVariableType(value: string): value is EditorVariableType {
  return value === "text" || value === "image" || value === "url"
}

export function LiveBadge() {
  return (
    <Badge variant="outline" className="gap-1">
      <span className="size-1.5 rounded-full bg-variable-foreground" />
      Live
    </Badge>
  )
}
