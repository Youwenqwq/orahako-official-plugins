import { useEffect, useState } from "react"
import { toast } from "sonner"
import type {
  DerivedComponentProps,
  ObservableSource,
  SlotComponent,
} from "@orahako/sdk"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@orahako/ui-primitives"
import { SkbirdClient, type SkbirdConfig, generateDeviceId } from "../client"
import type { SkbirdDictionary } from "../i18n"
import type { SkbirdConfigStoreInstance } from "../store"

export interface SkbirdSettingsInject {
  readonly hooks: {
    readonly hydrated: ObservableSource<boolean>
  }
  readonly createClient: (config: SkbirdConfig) => SkbirdClient
}

export type SkbirdSettingsPageProps = DerivedComponentProps<
  Record<string, never>,
  SkbirdDictionary,
  undefined,
  SkbirdConfigStoreInstance,
  SkbirdSettingsInject
>

export const SkbirdSettingsPage: SlotComponent<SkbirdSettingsPageProps> = (props) => {
  const { t, useStore, actions, useHydrated, createClient } = props
  const token = useStore((state) => state.token)
  const deviceId = useStore((state) => state.deviceId)
  const alias = useStore((state) => state.alias)
  const hasHydrated = useHydrated()

  const [tokenInput, setTokenInput] = useState("")
  const [deviceIdInput, setDeviceIdInput] = useState("")
  const [aliasInput, setAliasInput] = useState("ysu")
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (!hasHydrated) return
    setTokenInput(token)
    setDeviceIdInput(deviceId)
    setAliasInput(alias)
  }, [hasHydrated, token, deviceId, alias])

  function handleSave() {
    actions.setConfig({ token: tokenInput, deviceId: deviceIdInput, alias: aliasInput })
    toast.success(t("skbird.saved"))
  }

  async function handleTest() {
    setTesting(true)
    try {
      const client = createClient({
        token: tokenInput.trim(),
        deviceId: deviceIdInput.trim() || generateDeviceId(),
        alias: aliasInput.trim() || "ysu",
      })
      const info = await client.userInfo()
      const nickname = typeof info.nickname === "string" && info.nickname ? info.nickname : "OK"
      toast.success(t("skbird.testSuccess", { nickname }))
    } catch (e) {
      toast.error(
        t("skbird.testFailed", {
          message: e instanceof Error ? e.message : String(e),
        })
      )
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("skbird.settingsTitle")}</CardTitle>
          <CardDescription>{t("skbird.noTokenHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>{t("skbird.tokenLabel")}</FieldLabel>
              <Textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="X-Sc-Token"
                rows={3}
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel>{t("skbird.deviceIdLabel")}</FieldLabel>
              <Input
                value={deviceIdInput}
                onChange={(e) => setDeviceIdInput(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel>{t("skbird.aliasLabel")}</FieldLabel>
              <Input
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                autoComplete="off"
              />
              <FieldDescription>{t("skbird.aliasHint")}</FieldDescription>
            </Field>
            <div className="flex gap-2">
              <Button onClick={handleSave}>{t("skbird.save")}</Button>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !tokenInput.trim()}
              >
                {t("skbird.testConnection")}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
