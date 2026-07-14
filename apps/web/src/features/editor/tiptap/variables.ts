import type { HandoutVariableOption } from "./schema"

export const editorVariables: HandoutVariableOption[] = [
  {
    id: "recipient-name",
    name: "Name",
    slug: "name",
    description: "The first name of the person receiving this page.",
    defaultValue: "you",
  },
  {
    id: "recipient-company",
    name: "Company",
    slug: "company",
    description: "The company receiving this page.",
    defaultValue: "your company",
  },
  {
    id: "recipient_website",
    name: "Website",
    slug: "website",
    description: "The recipient company's website, used to derive their logo when available.",
  },
]

export const editorVariableValues = {
  default: {
    "recipient-name": "you",
    "recipient-company": "your company",
    recipient_website: "linear.app",
  },
}
