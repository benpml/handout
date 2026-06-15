import { createContext } from "react"
import type { AppBootstrapResponse } from "@lightsite/contracts"

export type AppBootstrapContextValue = AppBootstrapResponse

export const AppBootstrapContext = createContext<AppBootstrapContextValue | null>(null)
