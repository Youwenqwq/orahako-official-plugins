import { useEffect, useState, type ComponentType } from "react"
import { Settings } from "lucide-react"
import type {
  DerivedComponentProps,
  ObservableSource,
  RouteLocation,
  SlotComponent,
} from "@orahako/sdk"
import { Button } from "@orahako/ui-primitives"
import type { SkbirdDictionary } from "./i18n"

declare module "@orahako/sdk" {
  interface SlotMap {
    "shell.header.actions": { kind: "list"; owner: Record<string, never> }
  }
}

/**
 * Navigation badges are plain prop-less components, so the plugin binds the
 * unread observable when it creates the badge during `apply` instead of
 * reading host state from the component.
 */
function useObservableValue<T>(source: ObservableSource<T>): T {
  const [value, setValue] = useState<T>(() => source.getSnapshot())
  useEffect(() => {
    setValue(source.getSnapshot())
    return source.subscribe(() => setValue(source.getSnapshot()))
  }, [source])
  return value
}

export function createSkbirdMessagesBadge(unread: ObservableSource<number>): ComponentType {
  return function SkbirdMessagesBadge() {
    const count = useObservableValue(unread)
    if (count <= 0) return null
    return (
      <span className="absolute -top-0.5 -right-1.5 size-2 rounded-full bg-destructive">
        <span className="sr-only">{count}</span>
      </span>
    )
  }
}

export interface SkbirdHeaderActionInject {
  readonly hooks: {
    readonly location: ObservableSource<RouteLocation>
  }
  readonly pluginId: string
  readonly openSettings: () => void
}

export type SkbirdHeaderActionProps = DerivedComponentProps<
  Record<string, never>,
  SkbirdDictionary,
  undefined,
  undefined,
  SkbirdHeaderActionInject
>

/** Mobile settings entry, shown only while the Skbird feed page is active. */
export const SkbirdHeaderAction: SlotComponent<SkbirdHeaderActionProps> = (props) => {
  const location = props.useLocation()
  const onIndex =
    location.pluginId === props.pluginId && (location.pageId ?? "index") === "index"
  if (!onIndex) return null
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      className="md:hidden"
      aria-label={props.t("skbird.settingsTitle")}
      onClick={() => props.openSettings()}
    >
      <Settings className="size-4" />
    </Button>
  )
}
