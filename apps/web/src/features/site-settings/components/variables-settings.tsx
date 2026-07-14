import { useId, useMemo, useState } from "react"
import {
  IconBraces,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import type { SiteVariableDefinition } from "@handout/site-document"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Textarea } from "@/components/ui/textarea"

import { SYSTEM_SITE_VARIABLE_IDS, systemSiteVariables } from "../model"

type VariableInput = Pick<SiteVariableDefinition, "defaultValue" | "description" | "label">

type VariablesSettingsProps = {
  onCreate: (input: VariableInput) => void
  onDelete: (variableId: string) => void
  onEdit: (variableId: string, input: VariableInput) => void
  usageCounts: Readonly<Record<string, number>>
  variables: SiteVariableDefinition[]
}

export function VariablesSettings({
  onCreate,
  onDelete,
  onEdit,
  usageCounts,
  variables,
}: VariablesSettingsProps) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingVariable, setEditingVariable] = useState<SiteVariableDefinition | null>(null)
  const [deletingVariable, setDeletingVariable] = useState<SiteVariableDefinition | null>(null)
  const customVariables = useMemo(
    () => variables.filter((variable) => !SYSTEM_SITE_VARIABLE_IDS.has(variable.id)),
    [variables],
  )

  const openCreator = () => {
    setEditingVariable(null)
    setEditorOpen(true)
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-1">
      <div>
        <h2 className="text-sm font-medium text-foreground">Variables</h2>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          Configure recipient content variables on this site.
        </p>
      </div>

      <ItemGroup className="gap-1.5">
        {systemSiteVariables.map((variable) => (
          <VariableRow key={variable.id} variable={variable} system />
        ))}
        {customVariables.map((variable) => (
          <VariableRow
            key={variable.id}
            variable={variable}
            onDelete={() => setDeletingVariable(variable)}
            onEdit={() => {
              setEditingVariable(variable)
              setEditorOpen(true)
            }}
          />
        ))}
      </ItemGroup>

      <Button variant="outline" className="w-full" onClick={openCreator}>
        <IconPlus data-icon="inline-start" />
        Create variable
      </Button>

      <VariableEditorDialog
        key={editorOpen ? editingVariable?.id ?? "create-open" : "editor-closed"}
        open={editorOpen}
        variable={editingVariable}
        onOpenChange={setEditorOpen}
        onSubmit={(input) => {
          if (editingVariable) onEdit(editingVariable.id, input)
          else onCreate(input)
          setEditorOpen(false)
        }}
      />

      <VariableDeleteDialog
        open={Boolean(deletingVariable)}
        usageCount={deletingVariable ? usageCounts[deletingVariable.id] ?? 0 : 0}
        variable={deletingVariable}
        onOpenChange={(open) => {
          if (!open) setDeletingVariable(null)
        }}
        onDelete={() => {
          if (deletingVariable) onDelete(deletingVariable.id)
          setDeletingVariable(null)
        }}
      />
    </div>
  )
}

function VariableRow({
  onDelete,
  onEdit,
  system = false,
  variable,
}: {
  onDelete?: () => void
  onEdit?: () => void
  system?: boolean
  variable: SiteVariableDefinition
}) {
  return (
    <Item variant="outline" className="min-h-[58px] rounded-xl px-3 py-2.5">
      <ItemMedia variant="icon" className="text-variable-foreground">
        <IconBraces />
      </ItemMedia>
      <ItemContent className="gap-0">
        <ItemTitle className="text-variable-foreground">{variable.label}</ItemTitle>
        <ItemDescription className="text-xs">
          {variable.description?.trim() || "No description"}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="gap-1">
        {system ? (
          <Badge variant="secondary">System</Badge>
        ) : (
          <>
            <Button variant="ghost" size="icon-compact" aria-label={`Edit ${variable.label}`} onClick={onEdit}>
              <IconEdit />
            </Button>
            <Button variant="ghost" size="icon-compact" aria-label={`Delete ${variable.label}`} onClick={onDelete}>
              <IconTrash />
            </Button>
          </>
        )}
      </ItemActions>
    </Item>
  )
}

function VariableEditorDialog({
  onOpenChange,
  onSubmit,
  open,
  variable,
}: {
  onOpenChange: (open: boolean) => void
  onSubmit: (input: VariableInput) => void
  open: boolean
  variable: SiteVariableDefinition | null
}) {
  const nameId = useId()
  const descriptionId = useId()
  const defaultId = useId()
  const [name, setName] = useState(variable?.label ?? "")
  const [description, setDescription] = useState(variable?.description ?? "")
  const [defaultValue, setDefaultValue] = useState(
    typeof variable?.defaultValue === "string" ? variable.defaultValue : "",
  )
  const normalizedName = name.trim().replace(/\s+/g, " ")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{variable ? "Edit variable" : "Create variable"}</DialogTitle>
          <DialogDescription>
            {variable
              ? "Update this variable everywhere it is used on the site."
              : "Create reusable recipient content for this site."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault()
            if (!normalizedName) return
            onSubmit({
              label: normalizedName,
              description: description.trim() || undefined,
              defaultValue,
            })
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={nameId}>Name</FieldLabel>
              <Input id={nameId} maxLength={120} autoFocus value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor={descriptionId}>Description</FieldLabel>
              <Textarea id={descriptionId} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor={defaultId}>Default value</FieldLabel>
              <Input id={defaultId} maxLength={4000} value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!normalizedName}>{variable ? "Save changes" : "Create variable"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function VariableDeleteDialog({
  onDelete,
  onOpenChange,
  open,
  usageCount,
  variable,
}: {
  onDelete: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  usageCount: number
  variable: SiteVariableDefinition | null
}) {
  const places = usageCount === 1 ? "place" : "places"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {variable?.label ?? "variable"}?</AlertDialogTitle>
          <AlertDialogDescription>
            {usageCount > 0
              ? `This variable is used in ${usageCount} ${places} across the site. Those references will show as missing until they are replaced.`
              : "This variable is not currently used on the site."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>Delete variable</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
