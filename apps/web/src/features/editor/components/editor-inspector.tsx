import { useRef } from "react"
import {
  IconCopy,
  IconLayoutGrid,
  IconPhoto,
  IconPlus,
  IconSparkles,
  IconTrash,
  IconVariable,
  IconX,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  blockLabel,
  formatVariableToken,
  type ButtonBlock,
  type EditableBlockType,
  type EditorBlock,
  type EditorVariable,
  type HeadingBlock,
  type ImageBlock,
  type LogoGridBlock,
  type TestimonialBlock,
  type TextBlock,
  type TitleBlock,
  type TitleSectionContent,
  type VideoBlock,
} from "../editor-data"
import { VariableButton, VariableChip } from "./editor-atoms"

type EditorInspectorProps = {
  title: TitleSectionContent
  selectedBlock?: EditorBlock
  selectedBlockId: string
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateTitle: (patch: Partial<TitleSectionContent>) => void
  onUpdateBlock: (block: EditorBlock) => void
  onConvertBlock: (blockId: string, type: EditableBlockType) => void
  onDuplicateBlock: (blockId: string) => void
  onDeleteBlock: (blockId: string) => void
}

export function EditorInspector({
  title,
  selectedBlock,
  selectedBlockId,
  variables,
  onCreateVariable,
  onUpdateTitle,
  onUpdateBlock,
  onConvertBlock,
  onDuplicateBlock,
  onDeleteBlock,
}: EditorInspectorProps) {
  if (selectedBlockId === "title-section" || !selectedBlock) {
    return (
      <TitleInspector
        title={title}
        variables={variables}
        onCreateVariable={onCreateVariable}
        onUpdateTitle={onUpdateTitle}
      />
    )
  }

  if (selectedBlock.type === "title" || selectedBlock.type === "heading" || selectedBlock.type === "text") {
    return (
      <TextInspector
        block={selectedBlock}
        variables={variables}
        onCreateVariable={onCreateVariable}
        onUpdateBlock={onUpdateBlock}
        onConvertBlock={onConvertBlock}
        onDuplicateBlock={onDuplicateBlock}
        onDeleteBlock={onDeleteBlock}
      />
    )
  }

  return (
    <BlockInspector
      block={selectedBlock}
      variables={variables}
      onCreateVariable={onCreateVariable}
      onUpdateBlock={onUpdateBlock}
      onDuplicateBlock={onDuplicateBlock}
      onDeleteBlock={onDeleteBlock}
    />
  )
}

function InspectorShell({
  title,
  children,
  footer,
}: {
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <aside className="flex h-full min-h-0 w-[303px] shrink-0 flex-col overflow-hidden rounded-xl border bg-background">
      <div className="flex h-[47px] shrink-0 items-center px-4">
        <h2 className="text-sm leading-5 font-medium tracking-normal">{title}</h2>
      </div>
      <div className="shrink-0 px-4">
        <Separator />
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">{children}</div>
      {footer ? (
        <>
          <div className="shrink-0 px-4">
            <Separator />
          </div>
          <div className="shrink-0 p-4">{footer}</div>
        </>
      ) : null}
    </aside>
  )
}

function TitleInspector({
  title,
  variables,
  onCreateVariable,
  onUpdateTitle,
}: {
  title: TitleSectionContent
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateTitle: (patch: Partial<TitleSectionContent>) => void
}) {
  return (
    <InspectorShell title="Edit Title Section">
      <FieldSet>
        <FieldGroup className="gap-7">
          <Field>
            <FieldLabel>Avatar Style</FieldLabel>
            <ToggleGroup
              type="single"
              value={title.avatarStyle}
              onValueChange={(value) => {
                if (value === "single" || value === "double") {
                  onUpdateTitle({ avatarStyle: value })
                }
              }}
              spacing={2}
              className="grid w-full grid-cols-2"
            >
              <ToggleGroupItem value="single" variant="outline" className="h-[90px] flex-col gap-1.5">
                <span className="flex size-10 items-center justify-center rounded-lg border bg-background">
                  <IconSparkles className="size-3.5" />
                </span>
                <span className="text-sm leading-5">Single</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="double" variant="outline" className="h-[90px] flex-col gap-1.5">
                <span className="flex items-center justify-center gap-1">
                  <span className="flex size-10 items-center justify-center rounded-lg border bg-background">
                    <IconSparkles className="size-3.5" />
                  </span>
                  <span className="h-px w-3 bg-border" />
                  <span className="flex size-10 items-center justify-center rounded-lg border bg-background">
                    <IconVariable className="size-3.5" />
                  </span>
                </span>
                <span className="text-sm leading-5">Double</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <ImageField
            label="Avatar Image 1"
            value={title.avatarImage1}
            variables={variables}
            onCreateVariable={onCreateVariable}
            onChange={(avatarImage1) => onUpdateTitle({ avatarImage1 })}
          />
          <ImageField
            label="Avatar Image 2"
            value={title.avatarImage2}
            variables={variables}
            onCreateVariable={onCreateVariable}
            onChange={(avatarImage2) => onUpdateTitle({ avatarImage2 })}
          />
          <VariableTextField
            label="Title"
            value={title.title}
            variables={variables}
            onCreateVariable={onCreateVariable}
            onChange={(nextTitle) => onUpdateTitle({ title: nextTitle })}
          />
          <VariableTextField
            label="Subtitle"
            value={title.subtitle}
            variables={variables}
            onCreateVariable={onCreateVariable}
            onChange={(subtitle) => onUpdateTitle({ subtitle })}
            multiline
          />
        </FieldGroup>
      </FieldSet>
    </InspectorShell>
  )
}

function TextInspector({
  block,
  variables,
  onCreateVariable,
  onUpdateBlock,
  onConvertBlock,
  onDuplicateBlock,
  onDeleteBlock,
}: {
  block: TitleBlock | HeadingBlock | TextBlock
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateBlock: (block: EditorBlock) => void
  onConvertBlock: (blockId: string, type: EditableBlockType) => void
  onDuplicateBlock: (blockId: string) => void
  onDeleteBlock: (blockId: string) => void
}) {
  const textValue = block.type === "text" ? htmlToText(block.html) : block.text

  return (
    <InspectorShell
      title={blockLabel(block)}
      footer={<InspectorFooter blockId={block.id} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />}
    >
      <FieldSet>
        <FieldGroup className="gap-7">
          <Field>
            <FieldLabel>Type</FieldLabel>
            <ToggleGroup
              type="single"
              value={block.type}
              onValueChange={(value) => {
                if (value === "text" || value === "heading" || value === "title") {
                  onConvertBlock(block.id, value)
                }
              }}
              spacing={2}
              className="grid w-full grid-cols-3"
            >
              <ToggleGroupItem value="text" variant="outline" className="h-10">
                Text
              </ToggleGroupItem>
              <ToggleGroupItem value="heading" variant="outline" className="h-10">
                Heading
              </ToggleGroupItem>
              <ToggleGroupItem value="title" variant="outline" className="h-10">
                Title
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <div className="flex items-center gap-2">
              <FieldLabel className="flex-1">{textFieldLabel(block.type)}</FieldLabel>
              <VariableButton
                allowedTypes={["text"]}
                variables={variables}
                onCreateVariable={onCreateVariable}
                onSelect={(variableName) =>
                  onUpdateBlock(
                    block.type === "text"
                      ? { ...block, html: appendVariableToHtml(block.html, variableName) }
                      : { ...block, text: appendVariableToText(block.text, variableName) }
                  )
                }
              />
            </div>
            <Textarea
              className="min-h-20 resize-none"
              value={textValue}
              onChange={(event) => {
                const value = event.target.value
                onUpdateBlock(
                  block.type === "text"
                    ? { ...block, html: textToHtml(value) }
                    : block.type === "heading"
                    ? { ...block, text: value }
                    : { ...block, text: value }
                )
              }}
            />
          </Field>
        </FieldGroup>
      </FieldSet>
    </InspectorShell>
  )
}

function BlockInspector({
  block,
  variables,
  onCreateVariable,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
}: {
  block: Exclude<EditorBlock, TitleBlock | HeadingBlock | TextBlock>
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateBlock: (block: EditorBlock) => void
  onDuplicateBlock: (blockId: string) => void
  onDeleteBlock: (blockId: string) => void
}) {
  return (
    <InspectorShell
      title={blockLabel(block)}
      footer={<InspectorFooter blockId={block.id} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />}
    >
      {block.type === "image" ? (
        <ImageInspector
          block={block}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onUpdateBlock={onUpdateBlock}
        />
      ) : block.type === "video" ? (
        <VideoInspector
          block={block}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onUpdateBlock={onUpdateBlock}
        />
      ) : block.type === "button" ? (
        <ButtonInspector
          block={block}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onUpdateBlock={onUpdateBlock}
        />
      ) : block.type === "testimonial" ? (
        <TestimonialInspector
          block={block}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onUpdateBlock={onUpdateBlock}
        />
      ) : block.type === "logo-grid" ? (
        <LogoGridInspector
          block={block}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onUpdateBlock={onUpdateBlock}
        />
      ) : (
        <AccordionInspector
          block={block}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onUpdateBlock={onUpdateBlock}
        />
      )}
    </InspectorShell>
  )
}

function AccordionInspector({
  block,
  variables,
  onCreateVariable,
  onUpdateBlock,
}: {
  block: Extract<EditorBlock, { type: "accordion" }>
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  return (
    <FieldSet>
      <FieldGroup className="gap-4">
        {block.items.map((item, index) => (
          <div key={item.id} className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex-1 text-sm font-medium leading-5">Item {index + 1}</span>
              <Button
                variant="ghost"
                size="icon-field"
                aria-label={`Remove accordion item ${index + 1}`}
                onClick={() =>
                  onUpdateBlock({
                    ...block,
                    items: block.items.filter((currentItem) => currentItem.id !== item.id),
                  })
                }
              >
                <IconX />
              </Button>
            </div>
            <FieldGroup className="gap-3">
              <VariableTextField
                label="Item title"
                value={item.title}
                variables={variables}
                onCreateVariable={onCreateVariable}
                onChange={(title) =>
                  onUpdateBlock({
                    ...block,
                    items: block.items.map((currentItem) =>
                      currentItem.id === item.id ? { ...currentItem, title } : currentItem
                    ),
                  })
                }
              />
              <VariableTextField
                label="Item body"
                value={item.body}
                variables={variables}
                onCreateVariable={onCreateVariable}
                onChange={(body) =>
                  onUpdateBlock({
                    ...block,
                    items: block.items.map((currentItem) =>
                      currentItem.id === item.id ? { ...currentItem, body } : currentItem
                    ),
                  })
                }
                multiline
              />
            </FieldGroup>
          </div>
        ))}
        <Button
          variant="outline"
          size="compact"
          className="w-full"
          onClick={() =>
            onUpdateBlock({
              ...block,
              items: [
                ...block.items,
                {
                  id: `${block.id}-item-${block.items.length + 1}`,
                  title: "Title",
                  body: "Description",
                  expanded: true,
                },
              ],
            })
          }
        >
          <IconPlus data-icon="inline-start" />
          Add accordion item
        </Button>
      </FieldGroup>
    </FieldSet>
  )
}

function ImageInspector({
  block,
  variables,
  onCreateVariable,
  onUpdateBlock,
}: {
  block: ImageBlock
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  return (
    <FieldSet>
      <FieldGroup className="gap-7">
        <ImageField
          label="Image"
          value={block.src}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(src) => onUpdateBlock({ ...block, src })}
        />
        <VariableTextField
          label="Alt text"
          value={block.alt}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(alt) => onUpdateBlock({ ...block, alt })}
        />
        <Field>
          <FieldLabel>Width</FieldLabel>
          <ToggleGroup
            type="single"
            value={block.width}
            onValueChange={(value) => {
              if (value === "custom" || value === "full") {
                onUpdateBlock({ ...block, width: value })
              }
            }}
            spacing={2}
            className="grid w-full grid-cols-2"
          >
            <ToggleGroupItem value="custom" variant="outline" className="h-10">
              Resize
            </ToggleGroupItem>
            <ToggleGroupItem value="full" variant="outline" className="h-10">
              Full
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}

function VideoInspector({
  block,
  variables,
  onCreateVariable,
  onUpdateBlock,
}: {
  block: VideoBlock
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  return (
    <FieldSet>
      <FieldGroup className="gap-7">
        <VariableTextField
          label="Video URL"
          value={block.url}
          allowedTypes={["url"]}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(url) => onUpdateBlock({ ...block, url })}
        />
        <ImageField
          label="Thumbnail"
          value={block.thumbnail}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(thumbnail) => onUpdateBlock({ ...block, thumbnail })}
        />
      </FieldGroup>
    </FieldSet>
  )
}

function TestimonialInspector({
  block,
  variables,
  onCreateVariable,
  onUpdateBlock,
}: {
  block: TestimonialBlock
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  return (
    <FieldSet>
      <FieldGroup className="gap-7">
        <VariableTextField
          label="Quote"
          value={block.quote}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(quote) => onUpdateBlock({ ...block, quote })}
          multiline
        />
        <VariableTextField
          label="Name"
          value={block.name}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(name) => onUpdateBlock({ ...block, name })}
        />
        <VariableTextField
          label="Role"
          value={block.role}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(role) => onUpdateBlock({ ...block, role })}
        />
        <ImageField
          label="Avatar"
          value={block.avatar}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(avatar) => onUpdateBlock({ ...block, avatar })}
        />
      </FieldGroup>
    </FieldSet>
  )
}

function LogoGridInspector({
  block,
  variables,
  onCreateVariable,
  onUpdateBlock,
}: {
  block: LogoGridBlock
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  return (
    <FieldSet>
      <FieldGroup className="gap-4">
        {block.logos.map((logo, index) => (
          <div key={logo.id} className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center gap-2">
              <IconLayoutGrid className="size-3.5 text-tertiary-foreground" />
              <span className="flex-1 text-sm leading-5 font-medium">Logo {index + 1}</span>
              <Button
                variant="ghost"
                size="icon-field"
                aria-label={`Remove logo ${index + 1}`}
                onClick={() =>
                  onUpdateBlock({
                    ...block,
                    logos: block.logos.filter((currentLogo) => currentLogo.id !== logo.id),
                  })
                }
              >
                <IconX />
              </Button>
            </div>
            <FieldGroup className="gap-3">
              <VariableTextField
                label="Name"
                value={logo.name}
                variables={variables}
                onCreateVariable={onCreateVariable}
                onChange={(name) =>
                  onUpdateBlock({
                    ...block,
                    logos: block.logos.map((currentLogo) =>
                      currentLogo.id === logo.id ? { ...currentLogo, name } : currentLogo
                    ),
                  })
                }
              />
              <ImageField
                label="Logo image"
                value={logo.image}
                variables={variables}
                onCreateVariable={onCreateVariable}
                onChange={(image) =>
                  onUpdateBlock({
                    ...block,
                    logos: block.logos.map((currentLogo) =>
                      currentLogo.id === logo.id ? { ...currentLogo, image } : currentLogo
                    ),
                  })
                }
              />
            </FieldGroup>
          </div>
        ))}
        <Button
          variant="outline"
          size="compact"
          className="w-full"
          onClick={() =>
            onUpdateBlock({
              ...block,
              logos: [
                ...block.logos,
                {
                  id: `${block.id}-logo-${block.logos.length + 1}`,
                  name: "Logo",
                },
              ],
            })
          }
        >
          <IconPlus data-icon="inline-start" />
          Add logo
        </Button>
      </FieldGroup>
    </FieldSet>
  )
}

function ButtonInspector({
  block,
  variables,
  onCreateVariable,
  onUpdateBlock,
}: {
  block: ButtonBlock
  variables: EditorVariable[]
  onCreateVariable: (variable: EditorVariable) => void
  onUpdateBlock: (block: EditorBlock) => void
}) {
  return (
    <FieldSet>
      <FieldGroup className="gap-7">
        <VariableTextField
          label="Button"
          value={block.text}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(text) => onUpdateBlock({ ...block, text })}
        />
        <VariableTextField
          label="URL"
          value={block.url}
          allowedTypes={["url"]}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onChange={(url) => onUpdateBlock({ ...block, url })}
        />
        <Field>
          <FieldLabel>Style</FieldLabel>
          <ToggleGroup
            type="single"
            value={block.style}
            onValueChange={(value) => {
              if (value === "outline" || value === "filled") {
                onUpdateBlock({ ...block, style: value })
              }
            }}
            spacing={2}
            className="grid w-full grid-cols-2"
          >
            <ToggleGroupItem value="outline" variant="outline" className="h-10">
              Outline
            </ToggleGroupItem>
            <ToggleGroupItem value="filled" variant="outline" className="h-10">
              Filled
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <Field>
          <FieldLabel>Width</FieldLabel>
          <ToggleGroup
            type="single"
            value={block.width}
            onValueChange={(value) => {
              if (value === "hug" || value === "full") {
                onUpdateBlock({ ...block, width: value })
              }
            }}
            spacing={2}
            className="grid w-full grid-cols-2"
          >
            <ToggleGroupItem value="hug" variant="outline" className="h-10">
              Hug
            </ToggleGroupItem>
            <ToggleGroupItem value="full" variant="outline" className="h-10">
              Full
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}

function InspectorFooter({
  blockId,
  onDuplicateBlock,
  onDeleteBlock,
}: {
  blockId: string
  onDuplicateBlock: (blockId: string) => void
  onDeleteBlock: (blockId: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" size="compact" onClick={() => onDuplicateBlock(blockId)}>
        <IconCopy data-icon="inline-start" />
        Duplicate
      </Button>
      <Button variant="outline" size="compact" onClick={() => onDeleteBlock(blockId)}>
        <IconTrash data-icon="inline-start" />
        Delete
      </Button>
    </div>
  )
}

function ImageField({
  label,
  variables,
  value,
  onCreateVariable,
  onChange,
}: {
  label: string
  variables: EditorVariable[]
  value?: string
  onCreateVariable: (variable: EditorVariable) => void
  onChange: (url?: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isVariable = value?.startsWith("{{")

  function handleFile(file?: File) {
    if (!file) {
      return
    }

    onChange(URL.createObjectURL(file))
  }

  return (
    <Field>
      <div className="flex items-center gap-2">
        <FieldLabel className="flex-1">{label}</FieldLabel>
        <VariableButton
          allowedTypes={["image"]}
          label={`Attach variable to ${label}`}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onSelect={(variableName) => onChange(variableName)}
        />
      </div>
      <div className="relative">
        <button
          type="button"
          className="flex h-[100px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 text-muted-foreground transition-colors hover:bg-muted"
          onClick={() => inputRef.current?.click()}
        >
        {value ? (
          isVariable ? (
            <VariableChip>{value}</VariableChip>
          ) : (
            <img src={value} alt="" className="h-auto max-h-full w-full object-contain" />
          )
        ) : (
          <div className="flex flex-col items-center gap-2">
            <IconPhoto className="size-3.5" />
            <span className="text-sm">Click or drag here to upload</span>
          </div>
        )}
        </button>
        {value ? (
          <Button
            type="button"
            variant="outline"
            size="icon-field"
            className="absolute top-2 right-2"
            aria-label={`Remove ${label}`}
            onClick={() => onChange(undefined)}
          >
            <IconX />
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </Field>
  )
}

function VariableTextField({
  allowedTypes = ["text"],
  label,
  variables,
  value,
  onCreateVariable,
  onChange,
  multiline,
}: {
  allowedTypes?: Array<"text" | "url">
  label: string
  variables: EditorVariable[]
  value: string
  onCreateVariable: (variable: EditorVariable) => void
  onChange: (value: string) => void
  multiline?: boolean
}) {
  return (
    <Field>
      <div className="flex items-center gap-2">
        <FieldLabel className="flex-1">{label}</FieldLabel>
        <VariableButton
          allowedTypes={allowedTypes}
          label={`Attach variable to ${label}`}
          variables={variables}
          onCreateVariable={onCreateVariable}
          onSelect={(variableName) => onChange(appendVariableToText(value, variableName))}
        />
      </div>
      {multiline ? (
        <Textarea className="min-h-20 resize-none" value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </Field>
  )
}

export function VariableInputCard({
  onChange,
  variable,
  value,
}: {
  onChange: (value: string) => void
  variable: EditorVariable
  value: string
}) {
  const imagePreview = value || variable.defaultValue

  return (
    <div className="rounded-xl border bg-background p-2">
      <div className="mb-2 flex items-center gap-2">
        <VariableChip>{formatVariableToken(variable)}</VariableChip>
        <Badge variant="outline" className="ml-auto">
          {variable.type}
        </Badge>
      </div>
      {variable.type === "text" ? (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={variable.defaultValue || "Use default value"}
        />
      ) : variable.type === "url" ? (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={variable.defaultValue || "https://example.com"}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={variable.defaultValue || "https://example.com/logo.png"}
          />
          <div className="flex h-[96px] items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="h-auto max-h-full w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <IconPhoto className="size-3.5" />
                <span className="text-sm">Uses default image when empty</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function textFieldLabel(type: TitleBlock["type"] | HeadingBlock["type"] | TextBlock["type"]) {
  if (type === "title") {
    return "Title"
  }

  if (type === "heading") {
    return "Heading"
  }

  return "Text"
}

function htmlToText(html: string) {
  return html
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<br\s*\/?>(?=\s*<\/p>)/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
}

function textToHtml(value: string) {
  const paragraphs = value.split(/\n{2,}|\n/g)

  if (paragraphs.length === 0) {
    return "<p></p>"
  }

  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
}

function appendVariableToText(value: string, variableName: string) {
  return `${value}${value.endsWith(" ") || value.length === 0 ? "" : " "}${variableName}`
}

function appendVariableToHtml(value: string, variableName: string) {
  return textToHtml(appendVariableToText(htmlToText(value), variableName))
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
