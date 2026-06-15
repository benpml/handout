import {
  createBlock,
  createLocalBlockId,
  initialEditorBlocks,
  initialTitleSection,
  initialEditorVariables,
  type EditableBlockType,
  type EditorBlock,
  type EditorVariable,
  type TextBlock,
  type TitleBlock,
  type TitleSectionContent,
} from "./editor-data"

export const EDITOR_HISTORY_LIMIT = 60

export type EditorColorMode = "light" | "dark"

export type EditorDocument = {
  title: TitleSectionContent
  blocks: EditorBlock[]
  colorMode: EditorColorMode
  variables: EditorVariable[]
}

export type EditorCommand =
  | { type: "updateTitle"; patch: Partial<TitleSectionContent> }
  | { type: "updateBlock"; block: EditorBlock }
  | { type: "addBlock"; block: EditorBlock; afterBlockId?: string }
  | { type: "reorderBlocks"; activeId: string; overId: string }
  | { type: "convertBlock"; blockId: string; blockType: EditableBlockType }
  | { type: "duplicateBlock"; blockId: string }
  | { type: "deleteBlock"; blockId: string }
  | { type: "setColorMode"; colorMode: EditorColorMode }
  | { type: "createVariable"; variable: EditorVariable }

export type EditorHistoryState = {
  past: EditorDocument[]
  present: EditorDocument
  future: EditorDocument[]
}

export type EditorHistoryAction =
  | { type: "commit"; command: EditorCommand }
  | { type: "undo" }
  | { type: "redo" }

export function createInitialEditorDocument(): EditorDocument {
  return {
    title: { ...initialTitleSection },
    blocks: cloneBlocks(initialEditorBlocks),
    colorMode: "light",
    variables: cloneVariables(initialEditorVariables),
  }
}

export function createEditorHistoryState(
  present: EditorDocument = createInitialEditorDocument(),
): EditorHistoryState {
  return {
    past: [],
    present,
    future: [],
  }
}

export function editorHistoryReducer(
  state: EditorHistoryState,
  action: EditorHistoryAction,
): EditorHistoryState {
  if (action.type === "undo") {
    const previous = state.past.at(-1)

    if (!previous) {
      return state
    }

    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    }
  }

  if (action.type === "redo") {
    const next = state.future[0]

    if (!next) {
      return state
    }

    return {
      past: capHistory([...state.past, state.present]),
      present: next,
      future: state.future.slice(1),
    }
  }

  const next = applyEditorCommand(state.present, action.command)

  if (documentsEqual(state.present, next)) {
    return state
  }

  return {
    past: capHistory([...state.past, state.present]),
    present: next,
    future: [],
  }
}

export function applyEditorCommand(
  document: EditorDocument,
  command: EditorCommand,
): EditorDocument {
  if (command.type === "updateTitle") {
    return {
      ...document,
      title: { ...document.title, ...command.patch },
    }
  }

  if (command.type === "updateBlock") {
    return {
      ...document,
      blocks: document.blocks.map((block) =>
        block.id === command.block.id ? command.block : block,
      ),
    }
  }

  if (command.type === "addBlock") {
    return {
      ...document,
      blocks: addBlock(document.blocks, command.block, command.afterBlockId),
    }
  }

  if (command.type === "reorderBlocks") {
    return {
      ...document,
      blocks: reorderBlocks(document.blocks, command.activeId, command.overId),
    }
  }

  if (command.type === "convertBlock") {
    return {
      ...document,
      blocks: document.blocks.map((block) => convertBlock(block, command)),
    }
  }

  if (command.type === "duplicateBlock") {
    const sourceBlock = document.blocks.find((block) => block.id === command.blockId)

    if (!sourceBlock) {
      return document
    }

    return {
      ...document,
      blocks: addBlock(document.blocks, duplicateEditorBlock(sourceBlock), command.blockId),
    }
  }

  if (command.type === "deleteBlock") {
    return {
      ...document,
      blocks: document.blocks.filter((block) => block.id !== command.blockId),
    }
  }

  if (command.type === "createVariable") {
    if (
      document.variables.some((variable) =>
        variable.id === command.variable.id || variable.key === command.variable.key
      )
    ) {
      return document
    }

    return {
      ...document,
      variables: [...document.variables, command.variable],
    }
  }

  return {
    ...document,
    colorMode: command.colorMode,
  }
}

export function getNextSelectedBlockIdAfterDelete(
  blocks: EditorBlock[],
  blockId: string,
): string | null {
  const removedIndex = blocks.findIndex((block) => block.id === blockId)

  if (removedIndex === -1) {
    return null
  }

  const nextBlocks = blocks.filter((block) => block.id !== blockId)
  const nextSelectedBlock = nextBlocks[Math.min(removedIndex, nextBlocks.length - 1)]

  return nextSelectedBlock?.id ?? null
}

export function serializeEditorDocument(document: EditorDocument) {
  return JSON.stringify(document)
}

function addBlock(
  blocks: EditorBlock[],
  block: EditorBlock,
  afterBlockId?: string,
) {
  if (!afterBlockId) {
    return [...blocks, block]
  }

  const insertIndex = blocks.findIndex((currentBlock) => currentBlock.id === afterBlockId)

  if (insertIndex === -1) {
    return [...blocks, block]
  }

  return [
    ...blocks.slice(0, insertIndex + 1),
    block,
    ...blocks.slice(insertIndex + 1),
  ]
}

function reorderBlocks(blocks: EditorBlock[], activeId: string, overId: string) {
  const oldIndex = blocks.findIndex((block) => block.id === activeId)
  const newIndex = blocks.findIndex((block) => block.id === overId)

  if (oldIndex === -1 || newIndex === -1) {
    return blocks
  }

  const nextBlocks = [...blocks]
  const [movedBlock] = nextBlocks.splice(oldIndex, 1)

  if (!movedBlock) {
    return blocks
  }

  nextBlocks.splice(newIndex, 0, movedBlock)

  return nextBlocks
}

function convertBlock(
  block: EditorBlock,
  command: Extract<EditorCommand, { type: "convertBlock" }>,
): EditorBlock {
  if (block.id !== command.blockId || block.type === command.blockType) {
    return block
  }

  const text = blockToPlainText(block)

  if (command.blockType === "title") {
    return { id: block.id, type: command.blockType, text: text || "Title" }
  }

  if (command.blockType === "heading") {
    return { id: block.id, type: command.blockType, text: text || "Heading" }
  }

  if (command.blockType === "text") {
    return {
      id: block.id,
      type: command.blockType,
      html: `<p>${escapeHtml(text || "Start writing...")}</p>`,
    }
  }

  return { ...createBlock(command.blockType), id: block.id }
}

function cloneBlocks(blocks: EditorBlock[]) {
  return blocks.map((block) => cloneBlock(block))
}

function cloneVariables(variables: EditorVariable[]) {
  return variables.map((variable) => ({ ...variable }))
}

function cloneBlock(block: EditorBlock): EditorBlock {
  if (block.type === "accordion") {
    return { ...block, items: block.items.map((item) => ({ ...item })) }
  }

  if (block.type === "logo-grid") {
    return { ...block, logos: block.logos.map((logo) => ({ ...logo })) }
  }

  return { ...block }
}

export function duplicateEditorBlock(block: EditorBlock): EditorBlock {
  const id = createLocalBlockId(block.type)

  if (block.type === "accordion") {
    return {
      ...block,
      id,
      items: block.items.map((item, index) => ({
        ...item,
        id: `${id}-item-${index + 1}`,
      })),
    }
  }

  if (block.type === "logo-grid") {
    return {
      ...block,
      id,
      logos: block.logos.map((logo, index) => ({
        ...logo,
        id: `${id}-logo-${index + 1}`,
      })),
    }
  }

  return { ...block, id }
}

function blockToPlainText(block: EditorBlock) {
  if (block.type === "heading" || block.type === "title") {
    return block.text
  }

  if (block.type === "text") {
    return htmlToText(block.html)
  }

  if (block.type === "button") {
    return block.text
  }

  if (block.type === "accordion") {
    return block.items[0]?.title ?? ""
  }

  if (block.type === "video") {
    return block.url
  }

  if (block.type === "image") {
    return block.alt
  }

  if (block.type === "testimonial") {
    return block.quote
  }

  return block.logos[0]?.name ?? ""
}

function htmlToText(html: TextBlock["html"] | TitleBlock["text"]) {
  return html
    .replace(/<br\s*\/?>(?=\s*<\/p>)/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function capHistory(history: EditorDocument[]) {
  return history.slice(-EDITOR_HISTORY_LIMIT)
}

function documentsEqual(left: EditorDocument, right: EditorDocument) {
  return serializeEditorDocument(left) === serializeEditorDocument(right)
}
