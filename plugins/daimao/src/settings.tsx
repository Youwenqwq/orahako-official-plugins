import type { ReactNode } from "react"
import { RotateCcw } from "lucide-react"
import type { DerivedComponentProps, SlotComponent } from "@orahako/sdk"
import {
  Button,
  Card,
  CardContent,
  Slider,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from "@orahako/ui-primitives"
import type { DaimaoDictionary } from "./i18n"
import {
  isDaimaoPose,
  MAX_DAIMAO_SCALE,
  MIN_DAIMAO_SCALE,
  type DaimaoStoreDefinition,
} from "./store"

function SettingSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  readonly label: string
  readonly description: string
  readonly checked: boolean
  readonly onCheckedChange: (checked: boolean) => void
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  )
}

export type DaimaoSettingsProps = DerivedComponentProps<
  Record<string, never>,
  DaimaoDictionary,
  undefined,
  DaimaoStoreDefinition
>

export const DaimaoSettings: SlotComponent<DaimaoSettingsProps> = (props) => {
  const { t, useStore, actions } = props

  const enabled = useStore((s) => s.enabled)
  const scale = useStore((s) => s.scale)
  const pose = useStore((s) => s.pose)
  const santaHat = useStore((s) => s.santaHat)
  const showDesk = useStore((s) => s.showDesk)
  const blueDesk = useStore((s) => s.blueDesk)
  const altTea = useStore((s) => s.altTea)
  const altDango = useStore((s) => s.altDango)
  const altDish = useStore((s) => s.altDish)
  const riceBowl = useStore((s) => s.riceBowl)
  const eyeTracking = useStore((s) => s.eyeTracking)
  const speechBubbles = useStore((s) => s.speechBubbles)
  const keyboardReact = useStore((s) => s.keyboardReact)
  const showToolbar = useStore((s) => s.showToolbar)
  const clickThrough = useStore((s) => s.clickThrough)

  return (
    <div className="flex flex-col gap-4">
      <Card className="py-0">
        <CardContent className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("settings.enabled")}</span>
              <span className="text-xs text-muted-foreground">
                {t("settings.enabledDescription")}
              </span>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={actions.setEnabled}
              aria-label={t("settings.enabled")}
            />
          </div>

          <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("settings.scale")}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {Math.round(scale * 100)}%
              </span>
            </div>
            <Slider
              min={MIN_DAIMAO_SCALE}
              max={MAX_DAIMAO_SCALE}
              step={0.05}
              value={[scale]}
              onValueChange={([value]) => {
                if (typeof value === "number") actions.setScale(value)
              }}
            />
            <span className="text-xs text-muted-foreground">{t("settings.scaleDescription")}</span>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm">{t("settings.pose")}</span>
              <span className="text-xs text-muted-foreground">{t("settings.poseDescription")}</span>
            </div>
            <ToggleGroup
              type="single"
              value={pose}
              onValueChange={(value) => {
                if (isDaimaoPose(value)) actions.setPose(value)
              }}
              variant="outline"
              className="w-full"
            >
              <ToggleGroupItem value="tea" className="flex-1 text-xs">
                {t("settings.poseTea")}
              </ToggleGroupItem>
              <ToggleGroupItem value="dango" className="flex-1 text-xs">
                {t("settings.poseDango")}
              </ToggleGroupItem>
              <ToggleGroupItem value="gamer" className="flex-1 text-xs">
                {t("settings.poseGamer")}
              </ToggleGroupItem>
              <ToggleGroupItem value="relax" className="flex-1 text-xs">
                {t("settings.poseRelax")}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="border-t border-border/40 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => actions.resetLayout()}
            >
              <RotateCcw className="size-3.5" />
              {t("settings.resetLayout")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 py-4">
          <h3 className="text-sm font-medium">{t("settings.accessories")}</h3>

          <SettingSwitch
            label={t("settings.santaHat")}
            description={t("settings.santaHatDescription")}
            checked={santaHat}
            onCheckedChange={actions.setSantaHat}
          />
          <SettingSwitch
            label={t("settings.showDesk")}
            description={t("settings.showDeskDescription")}
            checked={showDesk}
            onCheckedChange={actions.setShowDesk}
          />
          {showDesk && (
            <SettingSwitch
              label={t("settings.blueDesk")}
              description={t("settings.blueDeskDescription")}
              checked={blueDesk}
              onCheckedChange={actions.setBlueDesk}
            />
          )}
          <SettingSwitch
            label={t("settings.altTea")}
            description={t("settings.altTeaDescription")}
            checked={altTea}
            onCheckedChange={actions.setAltTea}
          />
          <SettingSwitch
            label={t("settings.altDango")}
            description={t("settings.altDangoDescription")}
            checked={altDango}
            onCheckedChange={actions.setAltDango}
          />
          <SettingSwitch
            label={t("settings.altDish")}
            description={t("settings.altDishDescription")}
            checked={altDish}
            onCheckedChange={actions.setAltDish}
          />
          <SettingSwitch
            label={t("settings.riceBowl")}
            description={t("settings.riceBowlDescription")}
            checked={riceBowl}
            onCheckedChange={actions.setRiceBowl}
          />
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 py-4">
          <h3 className="text-sm font-medium">{t("settings.behavior")}</h3>
          <SettingSwitch
            label={t("settings.eyeTracking")}
            description={t("settings.eyeTrackingDescription")}
            checked={eyeTracking}
            onCheckedChange={actions.setEyeTracking}
          />
          <SettingSwitch
            label={t("settings.speechBubbles")}
            description={t("settings.speechBubblesDescription")}
            checked={speechBubbles}
            onCheckedChange={actions.setSpeechBubbles}
          />
          <SettingSwitch
            label={t("settings.keyboardReact")}
            description={t("settings.keyboardReactDescription")}
            checked={keyboardReact}
            onCheckedChange={actions.setKeyboardReact}
          />
          <SettingSwitch
            label={t("settings.showToolbar")}
            description={t("settings.showToolbarDescription")}
            checked={showToolbar}
            onCheckedChange={actions.setShowToolbar}
          />
          <SettingSwitch
            label={t("settings.clickThrough")}
            description={t("settings.clickThroughDescription")}
            checked={clickThrough}
            onCheckedChange={actions.setClickThrough}
          />
          <p className="border-t border-border/40 pt-3 text-xs text-muted-foreground">
            {t("settings.credit")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
