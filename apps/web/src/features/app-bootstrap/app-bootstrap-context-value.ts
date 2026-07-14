import { createContext } from "react"
import type { AppBootstrapResponse } from "@handout/contracts"

export type AppBootstrapContextValue = AppBootstrapResponse

export const AppBootstrapContext = createContext<AppBootstrapContextValue | null>(null)
