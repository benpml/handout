import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HANDOUT_THEME_CSS } from "@handout/design-tokens"

import "@/index.css"
import { GmailExtensionPanel } from "./panel"

document.documentElement.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches)
document.documentElement.classList.add("gmail-extension-panel")
const themeTokens = document.createElement("style")
themeTokens.dataset.handoutThemeTokens = ""
themeTokens.textContent = HANDOUT_THEME_CSS
document.head.append(themeTokens)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GmailExtensionPanel />
  </StrictMode>,
)
