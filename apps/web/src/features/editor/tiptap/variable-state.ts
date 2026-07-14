import type { Editor } from "@tiptap/core"

import type { HandoutVariableOption, HandoutVariableValueMap } from "./schema"

export const editorVariableStorageKey = "handoutNextVariables"

export type HandoutVariableStorage = {
  activeVariantId: string
  definitions: HandoutVariableOption[]
  values: HandoutVariableValueMap
}

export function getHandoutVariableStorage(editor: Editor): HandoutVariableStorage {
  const storage = editor.storage as unknown as Record<string, unknown>

  return storage[editorVariableStorageKey] as HandoutVariableStorage
}

export function findHandoutVariable(editor: Editor, variableId: string) {
  return getHandoutVariableStorage(editor).definitions.find((variable) => variable.id === variableId)
}

export function setHandoutVariableDefinitions(
  editor: Editor,
  definitions: HandoutVariableOption[],
) {
  const storage = getHandoutVariableStorage(editor)
  storage.definitions = definitions
  editor.view.dispatch(editor.state.tr.setMeta("handoutNextVariablesChanged", true))
}

export function getHandoutVariableValue(editor: Editor, variableId: string) {
  const storage = getHandoutVariableStorage(editor)
  const variable = storage.definitions.find((definition) => definition.id === variableId)
  const variantValue = storage.values[storage.activeVariantId]?.[variableId]

  return variantValue ?? variable?.defaultValue ?? ""
}

export function createHandoutVariableId(name: string) {
  const slug = createHandoutVariableSlug(name)
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)

  return `var-${slug || "variable"}-${suffix}`
}

export function createHandoutVariableSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getUniqueHandoutVariableSlug(name: string, variables: HandoutVariableOption[]) {
  const baseSlug = createHandoutVariableSlug(name) || "variable"
  const existingSlugs = new Set(variables.map((variable) => variable.slug))
  let nextSlug = baseSlug
  let suffix = 2

  while (existingSlugs.has(nextSlug)) {
    nextSlug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return nextSlug
}

export function normalizeHandoutVariableName(name: string) {
  return name.trim().replace(/\s+/g, " ")
}
