import type { JSONContent } from "@tiptap/core"
import { siteDocumentUniqueIdNodeTypes } from "@handout/site-document"

export type HandoutNextBlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "blockquote"
  | "bulletList"
  | "codeBlock"
  | "orderedList"
  | "taskList"
  | "emoji"
  | "pageTitle"
  | "iconList"
  | "image"
  | "imageCard"
  | "gif"
  | "iconCard"
  | "testimonial"
  | "logoGrid"
  | "button"
  | "calendar"
  | "video"
  | "grid"
  | "table"
  | "divider"

export type HandoutVariableOption = {
  id: string
  name: string
  slug: string
  type?: "text" | "image" | "url"
  description?: string
  defaultValue?: string
}

export type HandoutVariableValueMap = Record<string, Record<string, string>>

export const editorUniqueIdNodeTypes = [...siteDocumentUniqueIdNodeTypes]

export const initialEditorContent: JSONContent = createFirstPageEmptyContent()

export function createFirstPageEmptyContent(): JSONContent {
  return {
    type: "doc",
    content: [
      { type: "paragraph" },
    ],
  }
}

export function createAddedPageEmptyContent(): JSONContent {
  return {
    type: "doc",
    content: [
      { type: "paragraph" },
    ],
  }
}
