import { RefreshCw, Settings } from "lucide-react"
import type {
  DerivedComponentProps,
  ObservableSource,
  RouteLocation,
  SlotComponent,
} from "@orahako/sdk"
import { Button, cn } from "@orahako/ui-primitives"
import { PERLICA_ROUTE_INDEX } from "./constants"
import type { PerlicaDictionary } from "./i18n"

declare module "@orahako/sdk" {
  interface SlotMap {
    "shell.header.actions": { kind: "list"; owner: Record<string, never> }
  }
}

export interface PerlicaHeaderActionsInject {
  readonly hooks: {
    readonly location: ObservableSource<RouteLocation>
    readonly refreshing: ObservableSource<boolean>
  }
  readonly pluginId: string
  readonly requestRefresh: () => void
  readonly openSettings: () => void
}

export type PerlicaHeaderActionsProps = DerivedComponentProps<
  Record<string, never>,
  PerlicaDictionary,
  undefined,
  undefined,
  PerlicaHeaderActionsInject
>

export const PerlicaHeaderActions: SlotComponent<PerlicaHeaderActionsProps> = (props) => {
  const { t } = props
  const location = props.useLocation()
  const refreshing = props.useRefreshing()
  const onPerlicaPage = location.route
    ? location.route === PERLICA_ROUTE_INDEX
    : location.pluginId === props.pluginId && (location.pageId ?? "index") === "index"

  if (!onPerlicaPage) return null

  return (
    <div className="flex items-center gap-0.5 md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={props.requestRefresh}
        disabled={refreshing}
        aria-label={t("perlica.refresh")}
      >
        <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={props.openSettings}
        aria-label={t("perlica.settingsTitle")}
      >
        <Settings className="size-4" />
      </Button>
    </div>
  )
}
