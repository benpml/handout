import { AppBootstrapContext, type AppBootstrapContextValue } from "./app-bootstrap-context-value"

export function AppBootstrapProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: AppBootstrapContextValue
}) {
  return (
    <AppBootstrapContext.Provider value={value}>
      {children}
    </AppBootstrapContext.Provider>
  )
}
