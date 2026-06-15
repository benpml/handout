import { Fragment, useEffect, useRef, type ComponentType, type PointerEvent } from "react"
import {
  IconBrandFramerMotion,
  IconBrandStripe,
  IconHeading,
  IconLayoutGrid,
  IconLetterT,
  IconListDetails,
  IconMinus,
  IconMoon,
  IconPhoto,
  IconPlayerPlayFilled,
  IconPointer,
  IconPlus,
  IconQuote,
  IconSparkles,
  IconTextCaption,
  IconSunHigh,
  IconVideo,
} from "@tabler/icons-react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  createBlock,
  type AccordionBlock,
  type ButtonBlock,
  type EditableBlockType,
  type EditorBlock,
  type HeadingBlock,
  type ImageBlock,
  type LogoGridBlock,
  type TestimonialBlock,
  type TextBlock,
  type TitleBlock,
  type TitleSectionContent,
  type VideoBlock,
} from "../editor-data"
import { EditableBlockFrame } from "./editor-atoms"
import { TiptapField } from "./tiptap-field"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

type EditorCanvasProps = {
  title: TitleSectionContent
  blocks: EditorBlock[]
  selectedBlockId: string | null
  onSelectBlock: (blockId: string) => void
  onDeselect: () => void
  onUpdateTitle: (patch: Partial<TitleSectionContent>) => void
  onUpdateBlock: (block: EditorBlock) => void
  onAddBlock: (block: EditorBlock, afterBlockId?: string) => void
  onReorderBlocks: (activeId: string, overId: string) => void
  colorMode: "light" | "dark"
  onColorModeChange: (colorMode: "light" | "dark") => void
  preview?: boolean
}

export function EditorCanvas({
  title,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onDeselect,
  onUpdateTitle,
  onUpdateBlock,
  onAddBlock,
  onReorderBlocks,
  colorMode,
  onColorModeChange,
  preview,
}: EditorCanvasProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, left: 0 })
  }, [preview])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorderBlocks(String(active.id), String(over.id))
    }
  }

  function handleSitePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (preview) {
      return
    }

    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    if (
      target.closest(
        [
          "[data-editor-block-frame]",
          "[data-editor-add-line]",
          "[data-editor-topbar]",
          "[data-logo-grid-uploader]",
          "[data-radix-popper-content-wrapper]",
        ].join(",")
      )
    ) {
      return
    }

    onDeselect()
  }

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "h-full overflow-auto rounded-xl border bg-background",
        preview ? "mx-auto w-full max-w-[1066px]" : "w-full"
      )}
    >
      <div
        className={cn(
          "flex min-w-[602px] justify-center bg-background text-foreground",
          colorMode === "dark" && "dark"
        )}
        onPointerDown={handleSitePointerDown}
      >
        <article className="box-content min-h-[995px] w-[600px] border-x border-border-subtle bg-background font-site text-foreground">
          <PageTopBar
            brandName={title.brandName}
            editable={!preview}
            colorMode={colorMode}
            onBrandNameChange={(brandName) => onUpdateTitle({ brandName })}
            onColorModeChange={onColorModeChange}
          />
          <TitleSection
            title={title}
            selected={selectedBlockId === "title-section"}
            preview={preview}
            onSelect={() => onSelectBlock("title-section")}
            onUpdateTitle={onUpdateTitle}
          />
          <div className="border-t border-border-subtle px-7 py-7">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
                <div className="flex w-full flex-col">
                  {blocks.map((block) => (
                    <Fragment key={block.id}>
                      <SortableEditorBlock
                        block={block}
                        selected={selectedBlockId === block.id}
                        preview={preview}
                        onSelect={() => onSelectBlock(block.id)}
                        onUpdateBlock={onUpdateBlock}
                      />
                      {!preview ? (
                        <AddBlockLine
                          onAddBlock={(type) => onAddBlock(createBlock(type), block.id)}
                        />
                      ) : null}
                    </Fragment>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {!preview && blocks.length === 0 ? (
              <AddBlockLine onAddBlock={(type) => onAddBlock(createBlock(type))} />
            ) : null}
          </div>
          <PageFooter />
        </article>
      </div>
    </div>
  )
}

function PageTopBar({
  brandName,
  editable,
  colorMode,
  onBrandNameChange,
  onColorModeChange,
}: {
  brandName: string
  editable: boolean
  colorMode: "light" | "dark"
  onBrandNameChange: (brandName: string) => void
  onColorModeChange: (colorMode: "light" | "dark") => void
}) {
  return (
    <div data-editor-topbar="" className="flex h-[50px] items-center border-b border-border-subtle px-4">
      <div className="min-w-0 flex-1 text-sm leading-5 text-tertiary-foreground">
        <TiptapField
          value={brandName}
          onChange={onBrandNameChange}
          editable={editable}
          output="text"
          singleLine
          placeholder="Brand Name"
        />
      </div>
      <button
        type="button"
        className="inline-flex size-[26px] items-center justify-center rounded-lg text-tertiary-foreground hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
        aria-label="Toggle color mode"
        onClick={() => onColorModeChange(colorMode === "dark" ? "light" : "dark")}
      >
        {colorMode === "dark" ? <IconSunHigh /> : <IconMoon />}
      </button>
    </div>
  )
}

function TitleSection({
  title,
  selected,
  preview,
  onSelect,
  onUpdateTitle,
}: {
  title: TitleSectionContent
  selected?: boolean
  preview?: boolean
  onSelect: () => void
  onUpdateTitle: (patch: Partial<TitleSectionContent>) => void
}) {
  return (
    <EditableBlockFrame
      selected={selected}
      preview={preview}
      className="flex h-[204px] items-center justify-center rounded-none px-7"
      onClick={onSelect}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 items-center justify-center gap-2">
          <LogoTile
            value={title.avatarImage1}
            editable={!preview}
            onChange={(avatarImage1) => onUpdateTitle({ avatarImage1 })}
            variant="dark"
          />
          {title.avatarStyle === "double" ? (
            <>
              <div className="h-px w-4 bg-border-subtle" />
              <LogoTile
                value={title.avatarImage2}
                editable={!preview}
                onChange={(avatarImage2) => onUpdateTitle({ avatarImage2 })}
                variant="light"
              />
            </>
          ) : null}
        </div>
        <div className="flex w-[360px] max-w-full flex-col gap-1">
          <div className="text-[28px] leading-9 font-semibold tracking-normal">
            <TiptapField
              value={title.title}
              onChange={(nextTitle) => onUpdateTitle({ title: nextTitle })}
              editable={!preview}
              output="text"
              singleLine
              placeholder="Example Title"
            />
          </div>
          <div className="text-xl leading-7 text-tertiary-foreground">
            <TiptapField
              value={title.subtitle}
              onChange={(subtitle) => onUpdateTitle({ subtitle })}
              editable={!preview}
              output="text"
              singleLine
              placeholder="This is a subtitle"
            />
          </div>
        </div>
      </div>
    </EditableBlockFrame>
  )
}

function LogoTile({
  value,
  editable,
  onChange,
  variant,
}: {
  value?: string
  editable: boolean
  onChange: (url: string) => void
  variant: "dark" | "light"
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file?: File) {
    if (!file) {
      return
    }

    onChange(URL.createObjectURL(file))
  }

  return (
    <button
      type="button"
      className="flex size-14 items-center justify-center rounded-xl border bg-background"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        if (editable) {
          inputRef.current?.click()
        }
      }}
      aria-label="Swap avatar image"
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center overflow-hidden rounded-lg",
          value
            ? "bg-transparent text-foreground"
            : variant === "dark"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
        )}
      >
        {value ? (
          <img src={value} alt="" className="h-auto w-full object-contain" />
        ) : variant === "dark" ? (
          <IconSparkles className="size-3.5" />
        ) : (
          <IconBrandStripe className="size-3.5" />
        )}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </button>
  )
}

function SortableEditorBlock({
  block,
  selected,
  preview,
  onSelect,
  onUpdateBlock,
}: {
  block: EditorBlock
  selected: boolean
  preview?: boolean
  onSelect: () => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: preview })
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-70")}>
      <EditableBlockFrame
        selected={selected}
        preview={preview}
        blockType={block.type}
        onClick={onSelect}
        dragAttributes={attributes}
        dragListeners={listeners}
        className={blockFrameClassName(block)}
      >
        <BlockRenderer block={block} preview={preview} onSelect={onSelect} onUpdateBlock={onUpdateBlock} />
      </EditableBlockFrame>
    </div>
  )
}

function BlockRenderer({
  block,
  preview,
  onSelect,
  onUpdateBlock,
}: {
  block: EditorBlock
  preview?: boolean
  onSelect: () => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  if (block.type === "title") {
    return <TitleBlockEditor block={block} preview={preview} onSelect={onSelect} onUpdateBlock={onUpdateBlock} />
  }

  if (block.type === "heading") {
    return <HeadingBlockEditor block={block} preview={preview} onSelect={onSelect} onUpdateBlock={onUpdateBlock} />
  }

  if (block.type === "text") {
    return <TextBlockEditor block={block} preview={preview} onSelect={onSelect} onUpdateBlock={onUpdateBlock} />
  }

  if (block.type === "accordion") {
    return <AccordionBlockView block={block} preview={preview} onUpdateBlock={onUpdateBlock} onSelect={onSelect} />
  }

  if (block.type === "button") {
    return <ButtonBlockView block={block} />
  }

  if (block.type === "image") {
    return <ImageBlockView block={block} preview={preview} onUpdateBlock={onUpdateBlock} />
  }

  if (block.type === "testimonial") {
    return <TestimonialBlockView block={block} preview={preview} onUpdateBlock={onUpdateBlock} onSelect={onSelect} />
  }

  if (block.type === "logo-grid") {
    return <LogoGridBlockView block={block} preview={preview} onUpdateBlock={onUpdateBlock} />
  }

  return <VideoBlockView block={block} preview={preview} onUpdateBlock={onUpdateBlock} />
}

function blockFrameClassName(block: EditorBlock) {
  if (block.type === "title") {
    return "min-h-10 px-1.5 py-1.5"
  }

  if (block.type === "heading") {
    return "min-h-8 px-1.5 py-0.5"
  }

  if (block.type === "text") {
    return "min-h-[60px] px-1.5 py-1.5"
  }

  if (block.type === "image") {
    return "px-1.5 py-1.5"
  }

  return "px-1.5 py-1.5"
}

function TitleBlockEditor({
  block,
  preview,
  onSelect,
  onUpdateBlock,
}: {
  block: TitleBlock
  preview?: boolean
  onSelect: () => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  return (
    <div className="text-2xl leading-7 font-semibold tracking-normal">
      <TiptapField
        value={block.text}
        onChange={(text) => onUpdateBlock({ ...block, text })}
        editable={!preview}
        output="text"
        singleLine
        placeholder="Title"
        onFocus={onSelect}
      />
    </div>
  )
}

function HeadingBlockEditor({
  block,
  preview,
  onSelect,
  onUpdateBlock,
}: {
  block: HeadingBlock
  preview?: boolean
  onSelect: () => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  return (
    <div className="text-xl leading-7 font-medium tracking-normal">
      <TiptapField
        value={block.text}
        onChange={(text) => onUpdateBlock({ ...block, text })}
        editable={!preview}
        output="text"
        singleLine
        placeholder="Heading"
        onFocus={onSelect}
      />
    </div>
  )
}

function TextBlockEditor({
  block,
  preview,
  onSelect,
  onUpdateBlock,
}: {
  block: TextBlock
  preview?: boolean
  onSelect: () => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  return (
    <div className="text-base leading-6">
      <TiptapField
        value={block.html}
        onChange={(html) => onUpdateBlock({ ...block, html })}
        editable={!preview}
        placeholder="Write a short prospect-facing paragraph..."
        onFocus={onSelect}
      />
    </div>
  )
}

function AccordionBlockView({
  block,
  preview,
  onUpdateBlock,
  onSelect,
}: {
  block: AccordionBlock
  preview?: boolean
  onUpdateBlock: (block: EditorBlock) => void
  onSelect: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      {block.items.map((item) => (
        <div key={item.id} className="border-b last:border-b-0">
          <div
            className={cn(
              "flex w-full gap-0.5 px-4 py-3 pr-5 text-left",
              item.expanded ? "min-h-[74px] flex-col justify-center" : "min-h-12 items-center"
            )}
          >
            <div className="flex w-full items-center justify-between gap-3">
              <div className="min-w-0 flex-1 text-base leading-6 font-medium">
                <TiptapField
                  value={item.title}
                  onChange={(title) =>
                    onUpdateBlock({
                      ...block,
                      items: block.items.map((currentItem) =>
                        currentItem.id === item.id ? { ...currentItem, title } : currentItem
                      ),
                    })
                  }
                  editable={!preview}
                  output="text"
                  singleLine
                  placeholder="Title"
                  onFocus={onSelect}
                />
              </div>
              <button
                type="button"
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-tertiary-foreground hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
                aria-label={item.expanded ? "Collapse accordion item" : "Expand accordion item"}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  onUpdateBlock({
                    ...block,
                    items: block.items.map((currentItem) =>
                      currentItem.id === item.id
                        ? { ...currentItem, expanded: !currentItem.expanded }
                        : currentItem
                    ),
                  })
                }}
              >
                {item.expanded ? <IconMinus /> : <IconPlus />}
              </button>
            </div>
            {item.expanded ? (
              <div className="w-full text-sm leading-6 text-tertiary-foreground">
                <TiptapField
                  value={item.body}
                  onChange={(body) =>
                    onUpdateBlock({
                      ...block,
                      items: block.items.map((currentItem) =>
                        currentItem.id === item.id ? { ...currentItem, body } : currentItem
                      ),
                    })
                  }
                  editable={!preview}
                  output="text"
                  placeholder="Description"
                  onFocus={onSelect}
                />
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function ButtonBlockView({ block }: { block: ButtonBlock }) {
  return (
    <div className={cn("flex", block.width === "full" ? "w-full" : "w-fit")}>
      <Button variant={block.style === "filled" ? "default" : "outline"} className={cn(block.width === "full" && "w-full")}>
        {block.text}
      </Button>
    </div>
  )
}

function ImageBlockView({
  block,
  preview,
  onUpdateBlock,
}: {
  block: ImageBlock
  preview?: boolean
  onUpdateBlock: (block: EditorBlock) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isVariable = block.src?.startsWith("{{")

  function handleFile(file?: File) {
    if (!file) {
      return
    }

    onUpdateBlock({ ...block, src: URL.createObjectURL(file) })
  }

  const imageSurface = (
    <button
      type="button"
      className="flex h-[220px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-background text-tertiary-foreground transition-colors hover:bg-muted"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        if (!preview) {
          inputRef.current?.click()
        }
      }}
      aria-label="Upload image"
    >
      {block.src ? (
        isVariable ? (
          <span className="inline-flex rounded-md bg-variable-background px-1 text-[inherit] leading-[inherit] font-medium text-variable-foreground">
            {block.src}
          </span>
        ) : (
          <img src={block.src} alt={block.alt} className="size-full object-contain" />
        )
      ) : (
        <span className="flex flex-col items-center gap-2 text-sm leading-5">
          <IconPhoto className="size-3.5" />
          Add image
        </span>
      )}
    </button>
  )

  return (
    <div className="w-full">
      {block.width === "full" ? (
        imageSurface
      ) : (
        <ResizablePanelGroup orientation="horizontal" className="h-[220px] w-full">
          <ResizablePanel
            defaultSize={`${block.widthPercent}%`}
            minSize="36%"
            maxSize="100%"
            onResize={(panelSize) =>
              onUpdateBlock({ ...block, widthPercent: Math.round(panelSize.asPercentage) })
            }
          >
            {imageSurface}
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className="bg-transparent px-2"
            onPointerDown={(event) => event.stopPropagation()}
          />
          <ResizablePanel minSize="0%" defaultSize={`${100 - block.widthPercent}%`}>
            <div className="h-full" />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  )
}

function TestimonialBlockView({
  block,
  preview,
  onUpdateBlock,
  onSelect,
}: {
  block: TestimonialBlock
  preview?: boolean
  onUpdateBlock: (block: EditorBlock) => void
  onSelect: () => void
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-4 text-base leading-6">
        <TiptapField
          value={block.quote}
          onChange={(quote) => onUpdateBlock({ ...block, quote })}
          editable={!preview}
          output="text"
          placeholder="Add customer quote..."
          onFocus={onSelect}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center overflow-hidden rounded-full border bg-secondary text-secondary-foreground">
          {block.avatar ? (
            <img src={block.avatar} alt="" className="h-auto w-full object-contain" />
          ) : (
            <IconQuote className="size-3.5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm leading-5 font-medium">
            <TiptapField
              value={block.name}
              onChange={(name) => onUpdateBlock({ ...block, name })}
              editable={!preview}
              output="text"
              singleLine
              placeholder="Name"
              onFocus={onSelect}
            />
          </div>
          <div className="text-sm leading-5 text-tertiary-foreground">
            <TiptapField
              value={block.role}
              onChange={(role) => onUpdateBlock({ ...block, role })}
              editable={!preview}
              output="text"
              singleLine
              placeholder="Role"
              onFocus={onSelect}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function LogoGridBlockView({
  block,
  preview,
  onUpdateBlock,
}: {
  block: LogoGridBlock
  preview?: boolean
  onUpdateBlock: (block: EditorBlock) => void
}) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function handleFile(logoId: string, file?: File) {
    if (!file) {
      return
    }

    onUpdateBlock({
      ...block,
      logos: block.logos.map((logo) =>
        logo.id === logoId ? { ...logo, image: URL.createObjectURL(file) } : logo
      ),
    })
  }

  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-3">
      {block.logos.map((logo) => (
        <div
          key={logo.id}
          data-logo-grid-item=""
          className="flex h-[100px] flex-col items-center justify-start overflow-hidden rounded-lg px-0 text-center text-tertiary-foreground hover:bg-muted"
        >
          <button
            type="button"
            data-logo-grid-uploader=""
            className="mt-4 flex size-10 items-center justify-center overflow-hidden rounded-lg border bg-background text-muted-foreground hover:bg-muted"
            aria-label={`Upload ${logo.name || "logo"} logo`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              if (!preview) {
                inputRefs.current[logo.id]?.click()
              }
            }}
          >
            {logo.image ? (
              <img src={logo.image} alt={logo.name} className="h-auto max-h-full w-full object-contain" />
            ) : (
              <IconPhoto className="size-5" />
            )}
          </button>
          <span className="mt-2 flex h-6 w-full items-center justify-center px-2 text-base leading-6 text-foreground">
            <span className="truncate">{logo.name || "Logo"}</span>
          </span>
          <input
            ref={(element) => {
              inputRefs.current[logo.id] = element
            }}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => handleFile(logo.id, event.target.files?.[0])}
          />
        </div>
      ))}
    </div>
  )
}

function VideoBlockView({
  block,
  preview,
  onUpdateBlock,
}: {
  block: VideoBlock
  preview?: boolean
  onUpdateBlock: (block: EditorBlock) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file?: File) {
    if (!file) {
      return
    }

    onUpdateBlock({ ...block, thumbnail: URL.createObjectURL(file) })
  }

  return (
    <div className="rounded-lg bg-primary p-8">
      <button
        type="button"
        className="relative h-[241px] w-full overflow-hidden rounded-md bg-primary text-primary-foreground"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          if (!preview) {
            inputRef.current?.click()
          }
        }}
      >
        {block.thumbnail ? (
          <img src={block.thumbnail} alt="" className="size-full object-cover" />
        ) : (
          <VideoPlaceholder />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-[72px] items-center justify-center rounded-full bg-primary-foreground/35">
            <IconPlayerPlayFilled className="size-5" />
          </div>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  )
}

function VideoPlaceholder() {
  return (
    <>
      <div className="flex h-8 items-center gap-1.5 border-b border-primary-foreground/10 px-3 text-[10px] text-primary-foreground/70">
        <span className="size-2 rounded-full bg-primary-foreground/40" />
        <span className="size-2 rounded-full bg-primary-foreground/30" />
        <span className="size-2 rounded-full bg-primary-foreground/20" />
        <span className="ml-2">Text Blog Workspace</span>
      </div>
      <div className="grid h-[calc(100%-2rem)] grid-cols-[140px_1fr_96px] gap-px bg-primary-foreground/10">
        <div className="bg-primary p-3">
          {["Inbox", "Projects", "Views", "Reports", "Settings"].map((item) => (
            <div key={item} className="mb-2 h-3 rounded bg-primary-foreground/15" />
          ))}
        </div>
        <div className="bg-primary p-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="mb-3 h-3 rounded bg-primary-foreground/15" />
          ))}
        </div>
        <div className="bg-primary p-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="mb-2 h-4 rounded bg-primary-foreground/15" />
          ))}
        </div>
      </div>
    </>
  )
}

function AddBlockLine({ onAddBlock }: { onAddBlock: (type: EditableBlockType) => void }) {
  const blockTypes: Array<{
    type: EditableBlockType
    label: string
    description: string
    icon: ComponentType<{ className?: string }>
  }> = [
    { type: "title", label: "Title", description: "Large section title", icon: IconLetterT },
    { type: "heading", label: "Heading", description: "Medium text heading", icon: IconHeading },
    { type: "text", label: "Text", description: "Paragraph copy", icon: IconTextCaption },
    { type: "image", label: "Image", description: "Resizable image", icon: IconPhoto },
    { type: "button", label: "Button", description: "Linked CTA", icon: IconPointer },
    { type: "accordion", label: "Accordion", description: "Expandable rows", icon: IconListDetails },
    { type: "video", label: "Video", description: "Video embed", icon: IconVideo },
    { type: "testimonial", label: "Testimonial", description: "Customer quote", icon: IconQuote },
    { type: "logo-grid", label: "Logo Grid", description: "Customer logos", icon: IconLayoutGrid },
  ]

  return (
    <div data-editor-add-line="" className="relative flex h-4 w-full items-center overflow-visible">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group flex h-4 w-full items-center gap-1 px-1.5 text-editing-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Add block"
          >
            <span className="h-px min-w-px flex-1 bg-editing-foreground opacity-0 transition-colors transition-opacity group-hover:bg-editing-foreground-hover group-hover:opacity-100 group-data-[state=open]:bg-editing-foreground-hover group-data-[state=open]:opacity-100" />
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-editing-foreground text-background opacity-0 transition-colors transition-opacity group-hover:bg-editing-foreground-hover group-hover:opacity-100 group-data-[state=open]:bg-editing-foreground-hover group-data-[state=open]:opacity-100 [&_svg]:size-3.5">
              <IconPlus />
            </span>
            <span className="h-px min-w-px flex-1 bg-editing-foreground opacity-0 transition-colors transition-opacity group-hover:bg-editing-foreground-hover group-hover:opacity-100 group-data-[state=open]:bg-editing-foreground-hover group-data-[state=open]:opacity-100" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="bottom" sideOffset={4} className="w-[248px] p-1">
          <DropdownMenuGroup>
            {blockTypes.map((blockType) => {
              const Icon = blockType.icon

              return (
                <DropdownMenuItem
                  key={blockType.type}
                  className="h-9 gap-2 px-2 py-1 [&_svg]:size-3.5"
                  onClick={() => onAddBlock(blockType.type)}
                >
                  <Icon />
                  <span className="min-w-0 flex-1 leading-5">{blockType.label}</span>
                  <span className="hidden truncate text-xs leading-4 text-muted-foreground sm:block">
                    {blockType.description}
                  </span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function PageFooter() {
  return (
    <footer className="flex h-11 items-center justify-center gap-2 text-sm text-tertiary-foreground">
      <span>Made with</span>
      <IconBrandFramerMotion />
      <span>Lightsite</span>
    </footer>
  )
}
