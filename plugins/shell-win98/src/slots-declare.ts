import type { ReactNode } from "react"
import "@orahako/sdk"

declare module "@orahako/sdk" {
  interface SlotMap {
    "shell.gate": { kind: "chain"; owner: Record<string, never> }
    "shell.banner": { kind: "list"; owner: Record<string, never> }
    "shell.activity": { kind: "list"; owner: Record<string, never> }
    "shell.header.actions": { kind: "list"; owner: Record<string, never> }
    "shell.sidebar.footer": { kind: "list"; owner: Record<string, never> }
    "shell.overlay": { kind: "list"; owner: Record<string, never> }
    "settings.category.panel": { kind: "keyed"; owner: Record<string, never> }
  }

  interface ShellOwnerProps {
    renderPage?: (
      pluginId: string,
      pageId: string,
      options?: { readonly fallback?: ReactNode }
    ) => ReactNode
  }
}
