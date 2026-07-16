import { describe, expect, it } from "vitest"

import {
  buildPublicSiteUrl,
  getPublicSiteDisplayUrl,
} from "./public-site-url"

describe("public site urls", () => {
  it("builds production urls from site paths", () => {
    expect(
      buildPublicSiteUrl(
        "acme/launch-plan/linear-david",
        "https://handout.link/"
      )
    ).toBe("https://handout.link/acme/launch-plan/linear-david")
  })

  it("builds local urls from the configured public origin", () => {
    expect(
      buildPublicSiteUrl(
        "handout-dev/replay-verification/test-test",
        "http://localhost:3011"
      )
    ).toBe(
      "http://localhost:3011/handout-dev/replay-verification/test-test"
    )
    expect(
      getPublicSiteDisplayUrl(
        "handout-dev/replay-verification/test-test",
        "http://localhost:3011"
      )
    ).toBe("localhost:3011/handout-dev/replay-verification/test-test")
  })

  it("encodes each path segment without removing separators", () => {
    expect(
      buildPublicSiteUrl("north star/sales brief", "https://handout.link")
    ).toBe("https://handout.link/north%20star/sales%20brief")
  })
})
