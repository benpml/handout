import { describe, expect, it } from "vitest"

import {
  EDITOR_HISTORY_LIMIT,
  createEditorHistoryState,
  createInitialEditorDocument,
  editorHistoryReducer,
  getNextSelectedBlockIdAfterDelete,
  type EditorDocument,
} from "./editor-history"
import type { EditorBlock } from "./editor-data"

describe("editorHistoryReducer", () => {
  it("commits document commands and supports undo and redo", () => {
    const initialDocument = createInitialEditorDocument()
    const firstBlock = requireBlock(initialDocument.blocks[0])
    if (firstBlock.type !== "heading" && firstBlock.type !== "title") {
      throw new Error("Expected text-like block.")
    }
    const state = createEditorHistoryState(initialDocument)

    const updated = editorHistoryReducer(state, {
      type: "commit",
      command: {
        type: "updateBlock",
        block: { ...firstBlock, text: "Updated heading" },
      },
    })

    expect(updated.present.blocks[0]).toMatchObject({ text: "Updated heading" })
    expect(updated.past).toHaveLength(1)
    expect(updated.future).toHaveLength(0)

    const undone = editorHistoryReducer(updated, { type: "undo" })

    expect(undone.present.blocks[0]).toMatchObject({ text: firstBlock.text })
    expect(undone.future).toHaveLength(1)

    const redone = editorHistoryReducer(undone, { type: "redo" })

    expect(redone.present.blocks[0]).toMatchObject({ text: "Updated heading" })
    expect(redone.future).toHaveLength(0)
  })

  it("clears redo history after a new command", () => {
    const initialDocument = createInitialEditorDocument()
    const state = createEditorHistoryState(initialDocument)
    const updated = editorHistoryReducer(state, {
      type: "commit",
      command: { type: "updateTitle", patch: { title: "First edit" } },
    })
    const undone = editorHistoryReducer(updated, { type: "undo" })

    const next = editorHistoryReducer(undone, {
      type: "commit",
      command: { type: "updateTitle", patch: { title: "Second edit" } },
    })

    expect(next.present.title.title).toBe("Second edit")
    expect(next.future).toHaveLength(0)
  })

  it("caps history length", () => {
    let state = createEditorHistoryState(createInitialEditorDocument())

    for (let index = 0; index < EDITOR_HISTORY_LIMIT + 4; index += 1) {
      state = editorHistoryReducer(state, {
        type: "commit",
        command: { type: "updateTitle", patch: { title: `Title ${index}` } },
      })
    }

    expect(state.past).toHaveLength(EDITOR_HISTORY_LIMIT)
  })

  it("keeps converted text escaped when creating rich text HTML", () => {
    const titleBlock: EditorBlock = {
      id: "title_1",
      type: "title",
      text: "<script>alert(1)</script>",
    }
    const document: EditorDocument = {
      ...createInitialEditorDocument(),
      blocks: [titleBlock],
    }

    const next = editorHistoryReducer(createEditorHistoryState(document), {
      type: "commit",
      command: { type: "convertBlock", blockId: titleBlock.id, blockType: "text" },
    })

    expect(next.present.blocks[0]).toMatchObject({
      type: "text",
      html: "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    })
  })

  it("creates variables as undoable document changes", () => {
    const state = createEditorHistoryState(createInitialEditorDocument())
    const variable = {
      id: "var_test",
      key: "company_name",
      label: "Company name",
      type: "text" as const,
      defaultValue: "Acme",
    }

    const updated = editorHistoryReducer(state, {
      type: "commit",
      command: { type: "createVariable", variable },
    })

    expect(updated.present.variables).toContainEqual(variable)

    const undone = editorHistoryReducer(updated, { type: "undo" })

    expect(undone.present.variables).not.toContainEqual(variable)
  })

  it("does not create duplicate variable keys", () => {
    const initialDocument = createInitialEditorDocument()
    const existingVariable = requireVariable(initialDocument.variables[0])

    const updated = editorHistoryReducer(createEditorHistoryState(initialDocument), {
      type: "commit",
      command: {
        type: "createVariable",
        variable: {
          id: "var_duplicate",
          key: existingVariable.key,
          label: "Duplicate",
          type: existingVariable.type,
          defaultValue: "",
        },
      },
    })

    expect(updated).toMatchObject({
      past: [],
      future: [],
    })
    expect(updated.present.variables).toHaveLength(initialDocument.variables.length)
  })

  it("does not create duplicate variable ids", () => {
    const initialDocument = createInitialEditorDocument()
    const existingVariable = requireVariable(initialDocument.variables[0])

    const updated = editorHistoryReducer(createEditorHistoryState(initialDocument), {
      type: "commit",
      command: {
        type: "createVariable",
        variable: {
          id: existingVariable.id,
          key: "another_key",
          label: "Another key",
          type: "text",
          defaultValue: "",
        },
      },
    })

    expect(updated.past).toHaveLength(0)
    expect(updated.present.variables).toHaveLength(initialDocument.variables.length)
  })
})

describe("getNextSelectedBlockIdAfterDelete", () => {
  it("selects the next neighbor, then the previous neighbor, then none", () => {
    const blocks = createInitialEditorDocument().blocks

    expect(getNextSelectedBlockIdAfterDelete(blocks, requireBlock(blocks[1]).id)).toBe(
      requireBlock(blocks[2]).id,
    )
    expect(getNextSelectedBlockIdAfterDelete(blocks.slice(0, 1), requireBlock(blocks[0]).id)).toBeNull()
  })
})

function requireBlock(block: EditorBlock | undefined) {
  if (!block) {
    throw new Error("Expected block.")
  }

  return block
}

function requireVariable<T>(variable: T | undefined) {
  if (!variable) {
    throw new Error("Expected variable.")
  }

  return variable
}
