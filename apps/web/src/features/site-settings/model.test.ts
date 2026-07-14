import { createDefaultSiteContent } from "@handout/site-document"
import { describe, expect, it } from "vitest"

import { getSiteVariableUsageCounts, SYSTEM_SITE_VARIABLE_IDS } from "./model"

describe("site settings model", () => {
  it("keeps the three recipient system variables protected", () => {
    expect([...SYSTEM_SITE_VARIABLE_IDS]).toEqual([
      "recipient-name",
      "recipient-company",
      "recipient_website",
    ])
  })

  it("counts custom variable uses across every page", () => {
    const content = createDefaultSiteContent("Variable use")
    content.pages[0]!.document = {
      type: "doc",
      content: [{
        type: "paragraph",
        content: [
          { type: "variableToken", attrs: { variableId: "var-custom" } },
          { type: "text", text: " and " },
          { type: "variableToken", attrs: { variableId: "var-custom" } },
        ],
      }],
    }
    content.pages.push({
      id: "page-two",
      name: "Second",
      slug: "second",
      status: "visible",
      sortOrder: 1,
      document: {
        type: "doc",
        content: [{
          type: "paragraph",
          content: [{ type: "variableToken", attrs: { variableId: "var-custom" } }],
        }],
      },
    })

    expect(getSiteVariableUsageCounts(content)).toEqual({ "var-custom": 3 })
  })
})
