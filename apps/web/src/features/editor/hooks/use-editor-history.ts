import { useCallback, useReducer } from "react"

import {
  createEditorHistoryState,
  editorHistoryReducer,
  type EditorCommand,
} from "../editor-history"

export function useEditorHistory() {
  const [history, dispatchHistory] = useReducer(
    editorHistoryReducer,
    undefined,
    () => createEditorHistoryState(),
  )

  const dispatch = useCallback((command: EditorCommand) => {
    dispatchHistory({ type: "commit", command })
  }, [])

  const undo = useCallback(() => {
    dispatchHistory({ type: "undo" })
  }, [])

  const redo = useCallback(() => {
    dispatchHistory({ type: "redo" })
  }, [])

  return {
    document: history.present,
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    dispatch,
    redo,
    undo,
  }
}
