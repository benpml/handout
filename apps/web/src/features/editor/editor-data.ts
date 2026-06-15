export type EditableBlockType =
  | "title"
  | "heading"
  | "text"
  | "image"
  | "button"
  | "accordion"
  | "video"
  | "testimonial"
  | "logo-grid"
export type InspectorBlockType = EditableBlockType | "title-section"

export type TitleSectionContent = {
  brandName: string
  title: string
  subtitle: string
  avatarStyle: "single" | "double"
  avatarImage1?: string
  avatarImage2?: string
}

type BaseBlock = {
  id: string
  type: EditableBlockType
}

export type HeadingBlock = BaseBlock & {
  type: "heading"
  text: string
}

export type TitleBlock = BaseBlock & {
  type: "title"
  text: string
}

export type TextBlock = BaseBlock & {
  type: "text"
  html: string
}

export type ImageBlock = BaseBlock & {
  type: "image"
  src?: string
  alt: string
  width: "custom" | "full"
  widthPercent: number
}

export type AccordionBlock = BaseBlock & {
  type: "accordion"
  items: Array<{
    id: string
    title: string
    body: string
    expanded: boolean
  }>
}

export type VideoBlock = BaseBlock & {
  type: "video"
  url: string
  thumbnail?: string
}

export type ButtonBlock = BaseBlock & {
  type: "button"
  text: string
  url: string
  style: "outline" | "filled"
  width: "hug" | "full"
}

export type TestimonialBlock = BaseBlock & {
  type: "testimonial"
  quote: string
  name: string
  role: string
  avatar?: string
}

export type LogoGridBlock = BaseBlock & {
  type: "logo-grid"
  logos: Array<{
    id: string
    name: string
    image?: string
  }>
}

export type EditorBlock =
  | TitleBlock
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | AccordionBlock
  | VideoBlock
  | ButtonBlock
  | TestimonialBlock
  | LogoGridBlock

export type VariantRecord = {
  id: string
  name: string
  slug: string
  values?: Record<string, string>
}

export type EditorVariableType = "text" | "image" | "url"

export type EditorVariable = {
  id: string
  key: string
  label: string
  type: EditorVariableType
  defaultValue: string
}

export const initialTitleSection: TitleSectionContent = {
  brandName: "Brand Name",
  title: "Example Title",
  subtitle: "This is a subtitle",
  avatarStyle: "double",
}

export const initialEditorBlocks: EditorBlock[] = [
  { id: "heading", type: "heading", text: "Heading" },
  {
    id: "intro-text",
    type: "text",
    html: "<p>Playmaker is a high-performance <strong>AI sales rep</strong> that runs prospecting and outbound sales for you on autopilot. Here is an example for {{example_a}}</p>",
  },
  {
    id: "proof-logos",
    type: "logo-grid",
    logos: [
      { id: "logo-1", name: "Acme" },
      { id: "logo-2", name: "Northstar" },
      { id: "logo-3", name: "Orbit" },
      { id: "logo-4", name: "Linear" },
      { id: "logo-5", name: "Shopify" },
      { id: "logo-6", name: "Framer" },
    ],
  },
  {
    id: "details",
    type: "accordion",
    items: [
      { id: "item-1", title: "Title", body: "", expanded: false },
      {
        id: "item-2",
        title: "Title",
        body: "This is the body text of an accordion item.",
        expanded: true,
      },
      { id: "item-3", title: "Title", body: "", expanded: true },
    ],
  },
  { id: "demo-video", type: "video", url: "https://www.loom.com/share/demo" },
]

export const initialEditorVariables: EditorVariable[] = [
  {
    id: "var-example-a",
    key: "example_a",
    label: "Example A",
    type: "text",
    defaultValue: "Acme",
  },
  {
    id: "var-example-b",
    key: "example_b",
    label: "Example B",
    type: "text",
    defaultValue: "implementation team",
  },
  {
    id: "var-company-logo",
    key: "company_logo",
    label: "Company logo",
    type: "image",
    defaultValue: "",
  },
  {
    id: "var-booking_url",
    key: "booking_url",
    label: "Booking URL",
    type: "url",
    defaultValue: "https://example.com/book",
  },
]

export const editorVariants: VariantRecord[] = [
  { id: "default", name: "Default Variant", slug: "default" },
  {
    id: "john-acme",
    name: "John Doe at Acme",
    slug: "abc123x",
    values: {
      "var-example-a": "Acme",
      "var-example-b": "John's implementation team",
    },
  },
  {
    id: "maya-northstar",
    name: "Maya at Northstar",
    slug: "northstar",
    values: {
      "var-example-a": "Northstar",
      "var-example-b": "Maya's revenue team",
    },
  },
  { id: "sam-apex", name: "Sam at Apex", slug: "apex-q3" },
  { id: "rina-orbit", name: "Rina at Orbit", slug: "orbit" },
]

let localBlockSequence = 0
let localVariableSequence = 0
let localVariantSequence = 0

export function createLocalBlockId(prefix: string) {
  localBlockSequence += 1
  return `${prefix}-${localBlockSequence.toString(36)}`
}

export function createEditorVariable({
  defaultValue = "",
  key,
  type,
}: {
  defaultValue?: string
  key: string
  type: EditorVariableType
}): EditorVariable {
  localVariableSequence += 1
  const normalizedKey = normalizeVariableKey(key)

  return {
    id: `var-local-${localVariableSequence.toString(36)}`,
    key: normalizedKey,
    label: variableLabelFromKey(normalizedKey),
    type,
    defaultValue,
  }
}

export function createEditorVariant({
  existingSlugs,
  name,
  slug,
  variables,
}: {
  existingSlugs: ReadonlySet<string>
  name: string
  slug: string
  variables: EditorVariable[]
}): VariantRecord {
  localVariantSequence += 1

  return {
    id: `variant-local-${localVariantSequence.toString(36)}`,
    name: name.trim() || "Untitled variant",
    slug: uniqueVariantSlug(slug || "variant", existingSlugs),
    values: Object.fromEntries(variables.map((variable) => [variable.id, ""])),
  }
}

export function duplicateEditorVariant({
  existingSlugs,
  variant,
}: {
  existingSlugs: ReadonlySet<string>
  variant: VariantRecord
}): VariantRecord {
  localVariantSequence += 1

  return {
    ...variant,
    id: `variant-local-${localVariantSequence.toString(36)}`,
    name: `Copy of ${variant.name}`,
    slug: uniqueVariantSlug(`${variant.slug}-copy`, existingSlugs),
    values: { ...variant.values },
  }
}

export function formatVariableToken(variable: Pick<EditorVariable, "key">) {
  return `{{${variable.key}}}`
}

export function normalizeVariableKey(value: string) {
  return value
    .trim()
    .replace(/^\{\{|\}\}$/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/[^\w]/g, "")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
}

function variableLabelFromKey(key: string) {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function uniqueVariantSlug(slug: string, existingSlugs: ReadonlySet<string>) {
  const normalizedSlug = slug.trim() || "variant"

  if (!existingSlugs.has(normalizedSlug)) {
    return normalizedSlug
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${normalizedSlug}-${suffix}`

    if (!existingSlugs.has(candidate)) {
      return candidate
    }
  }

  return `${normalizedSlug}-${localVariantSequence.toString(36)}`
}

export function createBlock(type: EditableBlockType): EditorBlock {
  const id = createLocalBlockId(type)

  if (type === "title") {
    return { id, type, text: "Title" }
  }

  if (type === "heading") {
    return { id, type, text: "Heading" }
  }

  if (type === "text") {
    return { id, type, html: "<p>Start writing...</p>" }
  }

  if (type === "button") {
    return { id, type, text: "Button", url: "https://example.com", style: "outline", width: "hug" }
  }

  if (type === "image") {
    return { id, type, alt: "Image", width: "custom", widthPercent: 72 }
  }

  if (type === "testimonial") {
    return {
      id,
      type,
      quote: "Lightsite helped us send a polished, personalized follow-up in minutes.",
      name: "Alex Morgan",
      role: "VP Sales, Acme",
    }
  }

  if (type === "logo-grid") {
    return {
      id,
      type,
      logos: [
        { id: `${id}-logo-1`, name: "Acme" },
        { id: `${id}-logo-2`, name: "Northstar" },
        { id: `${id}-logo-3`, name: "Orbit" },
        { id: `${id}-logo-4`, name: "Linear" },
        { id: `${id}-logo-5`, name: "Shopify" },
        { id: `${id}-logo-6`, name: "Framer" },
      ],
    }
  }

  if (type === "video") {
    return { id, type, url: "" }
  }

  return {
    id,
    type: "accordion",
    items: [{ id: `${id}-item`, title: "Title", body: "Description", expanded: true }],
  }
}

export function blockLabel(block: EditorBlock | { type: "title-section" }) {
  switch (block.type) {
    case "title-section":
      return "Edit Title Section"
    case "title":
      return "Edit Title"
    case "heading":
      return "Edit Heading"
    case "text":
      return "Edit Text Block"
    case "image":
      return "Edit Image Block"
    case "accordion":
      return "Edit Accordion"
    case "video":
      return "Edit Video Block"
    case "button":
      return "Edit Button"
    case "testimonial":
      return "Edit Testimonial"
    case "logo-grid":
      return "Edit Logo Grid"
  }
}
