import { useContext } from "react"

import { AppBootstrapContext } from "./app-bootstrap-context-value"

export function useAppBootstrap() {
  const value = useContext(AppBootstrapContext)

  if (!value) {
    throw new Error("useAppBootstrap must be used inside AppBootstrapProvider.")
  }

  return value
}

export function useActiveWorkspace() {
  const bootstrap = useAppBootstrap()

  if (!bootstrap.activeWorkspace) {
    throw new Error("Active workspace is required for this route.")
  }

  return bootstrap.activeWorkspace
}
