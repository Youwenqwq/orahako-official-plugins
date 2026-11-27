import { useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, Copy, HelpCircle, Info, KeyRound, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type {
  DerivedComponentProps,
  ObservableSource,
  SlotComponent,
} from "@orahako/sdk"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Textarea,
} from "@orahako/ui-primitives"
import { CampusChargeClient, normalizeTokenInput } from "../client"
import {
  VCONSOLE_EXTRACT_SNIPPET,
  WECHAT_LOGIN_URL,
  WECHAT_VCONSOLE_URL,
} from "../devices"
import type { CampusChargeDictionary } from "../i18n"
import type { ChargeAuthStoreInstance } from "../store"

export interface ChargeSettingsInject {
  readonly hooks: {
    readonly hydrated: ObservableSource<boolean>
  }
  readonly createClient: (token: string) => CampusChargeClient
  readonly openIndex: () => void
}

export type ChargeSettingsPageProps = DerivedComponentProps<
  Record<string, never>,
  CampusChargeDictionary,
  undefined,
  ChargeAuthStoreInstance,
  ChargeSettingsInject
>

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fallback below.
  }
  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

export const ChargeSettingsPage: SlotComponent<ChargeSettingsPageProps> = (props) => {
  const { t, useStore, actions, useHydrated, createClient, openIndex } = props
  const savedToken = useStore((state) => state.token)
  const hydrated = useHydrated()

  const [tokenInput, setTokenInput] = useState("")
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    setTokenInput(savedToken)
  }, [hydrated, savedToken])

  async function handleCopy(text: string) {
    const ok = await copyText(text)
    if (ok) toast.success(t("charge.copied"))
    else toast.error(t("charge.copyFailed"))
  }

  function handleSave() {
    const cleaned = normalizeTokenInput(tokenInput)
    setTokenInput(cleaned)
    actions.setToken(cleaned)
    toast.success(t("charge.saved"))
  }

  function handleClear() {
    setTokenInput("")
    actions.clearToken()
    toast.success(t("charge.cleared"))
  }

  async function handleTest() {
    const cleaned = normalizeTokenInput(tokenInput)
    if (!cleaned) return
    setTesting(true)
    try {
      const client = createClient(cleaned)
      const { label } = await client.testConnection()
      toast.success(t("charge.testSuccess", { label }))
    } catch (error) {
      toast.error(
        t("charge.testFailed", {
          message: error instanceof Error ? error.message : String(error),
        })
      )
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={() => openIndex()}>
          <ArrowLeft className="mr-1.5 size-4" />
          {t("charge.backToDashboard")}
        </Button>
        <Badge variant={savedToken ? "default" : "secondary"}>
          {savedToken ? t("charge.tokenStatusConfigured") : t("charge.tokenStatusEmpty")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" />
            {t("charge.tokenSectionTitle")}
          </CardTitle>
          <CardDescription>{t("charge.tokenSectionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>{t("charge.tokenLabel")}</FieldLabel>
              <Textarea
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder={t("charge.tokenPlaceholder")}
                rows={3}
                autoComplete="off"
                className="font-mono text-xs"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSave} disabled={!tokenInput.trim()}>
                <CheckCircle2 className="mr-1.5 size-4" />
                {t("charge.save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleTest()}
                disabled={testing || !tokenInput.trim()}
              >
                {testing ? t("charge.testing") : t("charge.testConnection")}
              </Button>
              {savedToken && (
                <Button type="button" variant="ghost" onClick={handleClear}>
                  <Trash2 className="mr-1.5 size-4" />
                  {t("charge.clear")}
                </Button>
              )}
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="size-4" />
            {t("charge.guideTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <Info className="size-3.5" />
              {t("charge.guideWhyTitle")}
            </div>
            <p>{t("charge.guideWhyBody")}</p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="font-semibold">{t("charge.guideStep1Title")}</div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("charge.guideStep1Body")}
            </p>
            <div className="flex items-center justify-between gap-2 rounded bg-muted px-2.5 py-2">
              <code className="truncate font-mono text-xs">{WECHAT_LOGIN_URL}</code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleCopy(WECHAT_LOGIN_URL)}
              >
                <Copy className="mr-1 size-3.5" />
                {t("charge.copyLink")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="font-semibold">{t("charge.guideStep2Title")}</div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("charge.guideStep2Body")}
            </p>
            <div className="flex items-center justify-between gap-2 rounded bg-muted px-2.5 py-2">
              <code className="truncate font-mono text-xs">{WECHAT_VCONSOLE_URL}</code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleCopy(WECHAT_VCONSOLE_URL)}
              >
                <Copy className="mr-1 size-3.5" />
                {t("charge.copyLink")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="font-semibold">{t("charge.guideStep3Title")}</div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("charge.guideStep3MethodA")}
            </p>
            <div className="flex items-center justify-between gap-2 rounded bg-muted px-2.5 py-2">
              <code className="overflow-x-auto font-mono text-xs">
                {VCONSOLE_EXTRACT_SNIPPET}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => void handleCopy(VCONSOLE_EXTRACT_SNIPPET)}
              >
                <Copy className="mr-1 size-3.5" />
                {t("charge.copySnippet")}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("charge.guideStep3MethodB")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border p-3">
            <div className="font-semibold">{t("charge.guideStep4Title")}</div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("charge.guideStep4Body")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/40 p-3">
            <div className="text-xs font-semibold">{t("charge.guideTipsTitle")}</div>
            <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
              {t("charge.guideTipsBody")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
