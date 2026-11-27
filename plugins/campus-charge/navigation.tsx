import { Settings } from "lucide-react"
import type {
  DerivedComponentProps,
  ObservableSource,
  RouteLocation,
  SlotComponent,
} from "@orahako/sdk"
import { Button } from "@orahako/ui-primitives"
import type { CampusChargeDictionary } from "./i18n"

declare module "@orahako/sdk" {
  interface SlotMap {
    "shell.header.actions": { kind: "list"; owner: Record<string, never> }
  }
}

export interface ChargeHeaderActionInject {
  readonly hooks: {
    readonly location: ObservableSource<RouteLocation>
  }
  readonly pluginId: string
  readonly openSettings: () => void
}

export type ChargeHeaderActionProps = DerivedComponentProps<
  Record<string, never>,
  CampusChargeDictionary,
  undefined,
  undefined,
  ChargeHeaderActionInject
>

export const ChargeHeaderAction: SlotComponent<ChargeHeaderActionProps> = (props) => {
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
      aria-label={props.t("charge.settingsTitle")}
      onClick={() => props.openSettings()}
    >
      <Settings className="size-4" />
    </Button>
  )
}
