import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"

import { cn } from "@/lib/utils"
import { useActiveWorkspace } from "@/features/app-bootstrap/app-bootstrap-hooks"
import { queryKeys } from "@/lib/api/query-keys"
import { listSites } from "@/features/sites/api"
import {
  editorVariants,
  type EditableBlockType,
  type EditorBlock,
  type EditorVariable,
  type VariantRecord,
  type TitleSectionContent,
} from "./editor-data"
import {
  duplicateEditorBlock,
  getNextSelectedBlockIdAfterDelete,
  serializeEditorDocument,
  type EditorColorMode,
} from "./editor-history"
import { useEditorHistory } from "./hooks/use-editor-history"
import { EditorCanvas } from "./components/editor-canvas"
import { EditorHeader } from "./components/editor-header"
import { EditorInspector } from "./components/editor-inspector"
import { VariantsDialog } from "./components/variants-dialog"

type EditorChangeStatus = "idle" | "updating"

export function EditorPage() {
  const params = useParams({ strict: false })
  const siteId = "siteId" in params && typeof params.siteId === "string" ? params.siteId : ""
  const activeWorkspace = useActiveWorkspace()
  const sitesQuery = useQuery({
    queryKey: queryKeys.sites(activeWorkspace.id),
    queryFn: ({ signal }) => listSites(signal),
  })
  const { canRedo, canUndo, dispatch, document, redo, undo } = useEditorHistory()
  const currentSnapshot = useMemo(() => serializeEditorDocument(document), [document])
  const [savedSnapshot, setSavedSnapshot] = useState(currentSnapshot)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>("intro-text")
  const [preview, setPreview] = useState(false)
  const [variantsOpen, setVariantsOpen] = useState(false)
  const [variants, setVariants] = useState<VariantRecord[]>(() =>
    editorVariants.map((variant) => ({
      ...variant,
      values: variant.values ? { ...variant.values } : undefined,
    }))
  )
  const [selectedVariantId, setSelectedVariantId] = useState("default")
  const currentSite = sitesQuery.data?.sites.find((site) => site.id === siteId)
  const siteName = currentSite?.name ?? "Page draft"
  const siteSlug = currentSite?.slug ?? "page-draft"
  const changeStatus: EditorChangeStatus =
    currentSnapshot === savedSnapshot ? "idle" : "updating"

  const selectedBlock = useMemo(
    () => document.blocks.find((block) => block.id === selectedBlockId),
    [document.blocks, selectedBlockId]
  )
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0]

  useEffect(() => {
    if (currentSnapshot === savedSnapshot) {
      return
    }

    const saveTimeout = window.setTimeout(() => {
      setSavedSnapshot(currentSnapshot)
    }, 650)

    return () => window.clearTimeout(saveTimeout)
  }, [currentSnapshot, savedSnapshot])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target

      if (target instanceof HTMLElement && isEditableTarget(target)) {
        return
      }

      const isCommandKey = event.metaKey || event.ctrlKey

      if (!isCommandKey) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === "z" && !event.shiftKey && canUndo) {
        event.preventDefault()
        undo()
        return
      }

      if ((key === "y" || (key === "z" && event.shiftKey)) && canRedo) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [canRedo, canUndo, redo, undo])

  function handleUpdateTitle(patch: Partial<TitleSectionContent>) {
    dispatch({ type: "updateTitle", patch })
  }

  function handleUpdateBlock(nextBlock: EditorBlock) {
    dispatch({ type: "updateBlock", block: nextBlock })
  }

  function handleAddBlock(block: EditorBlock, afterBlockId?: string) {
    dispatch({ type: "addBlock", block, afterBlockId })
    setSelectedBlockId(block.id)
  }

  function handleReorderBlocks(activeId: string, overId: string) {
    dispatch({ type: "reorderBlocks", activeId, overId })
  }

  function handleConvertBlock(blockId: string, type: EditableBlockType) {
    dispatch({ type: "convertBlock", blockId, blockType: type })
  }

  function handleDuplicateBlock(blockId: string) {
    const sourceBlock = document.blocks.find((block) => block.id === blockId)

    if (!sourceBlock) {
      return
    }

    const duplicatedBlock = duplicateEditorBlock(sourceBlock)
    dispatch({ type: "addBlock", block: duplicatedBlock, afterBlockId: blockId })
    setSelectedBlockId(duplicatedBlock.id)
  }

  function handleDeleteBlock(blockId: string) {
    setSelectedBlockId(getNextSelectedBlockIdAfterDelete(document.blocks, blockId))
    dispatch({ type: "deleteBlock", blockId })
  }

  function handleColorModeChange(colorMode: EditorColorMode) {
    dispatch({ type: "setColorMode", colorMode })
  }

  function handleCreateVariable(variable: EditorVariable) {
    dispatch({ type: "createVariable", variable })
  }

  function handleCreateVariant(variant: VariantRecord) {
    setVariants((currentVariants) => [...currentVariants, variant])
  }

  function handleUpdateVariant(variant: VariantRecord) {
    setVariants((currentVariants) =>
      currentVariants.map((currentVariant) =>
        currentVariant.id === variant.id ? variant : currentVariant
      )
    )
  }

  function handleDeleteVariant(variantId: string) {
    setVariants((currentVariants) =>
      currentVariants.filter((variant) => variant.id === "default" || variant.id !== variantId)
    )
  }

  return (
    <div
      data-site-id={siteId}
      className="flex h-svh min-h-0 flex-col overflow-hidden bg-page-background"
    >
      <EditorHeader
        preview={preview}
        onPreviewChange={setPreview}
        onOpenVariants={() => setVariantsOpen(true)}
        selectedVariantName={selectedVariant?.name ?? "Default Variant"}
        siteName={siteName}
        changeStatus={changeStatus}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-1.5 p-1.5 pt-0",
          preview
            ? "grid-cols-1"
            : "grid-cols-[minmax(0,1fr)_auto] max-[760px]:grid-cols-1"
        )}
      >
        <section className="min-h-0 min-w-0">
          <EditorCanvas
            title={document.title}
            blocks={document.blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onUpdateTitle={handleUpdateTitle}
            onUpdateBlock={handleUpdateBlock}
            onAddBlock={handleAddBlock}
            onReorderBlocks={handleReorderBlocks}
            onDeselect={() => setSelectedBlockId(null)}
            colorMode={document.colorMode}
            onColorModeChange={handleColorModeChange}
            preview={preview}
          />
        </section>
        {!preview ? (
          <div
            data-editor-inspector-panel=""
            aria-hidden={selectedBlockId ? undefined : true}
            className={cn(
              "min-h-0 overflow-hidden transition-[width,opacity,transform] duration-200 ease-out max-[760px]:hidden",
              selectedBlockId ? "w-[303px] translate-x-0 opacity-100" : "w-0 translate-x-2 opacity-0"
            )}
          >
            <div className="h-full w-[303px]">
              {selectedBlockId ? (
                <EditorInspector
                  title={document.title}
                  selectedBlock={selectedBlock}
                  selectedBlockId={selectedBlockId}
                  variables={document.variables}
                  onCreateVariable={handleCreateVariable}
                  onUpdateTitle={handleUpdateTitle}
                  onUpdateBlock={handleUpdateBlock}
                  onConvertBlock={handleConvertBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  onDeleteBlock={handleDeleteBlock}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <VariantsDialog
        open={variantsOpen}
        onOpenChange={setVariantsOpen}
        variants={variants}
        variables={document.variables}
        selectedVariantId={selectedVariantId}
        onCreateVariant={handleCreateVariant}
        onDeleteVariant={handleDeleteVariant}
        onSelectVariant={setSelectedVariantId}
        onUpdateVariant={handleUpdateVariant}
        siteSlug={siteSlug}
        workspaceSlug={activeWorkspace.slug}
      />
    </div>
  )
}

function isEditableTarget(target: HTMLElement) {
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"))
}
