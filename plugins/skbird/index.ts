import { Bell, Bird, User } from "lucide-react"
import {
  createObservableSource,
  definePlugin,
  validatePluginManifest,
} from "@orahako/sdk"
import manifest from "./manifest.json"
import { SkbirdClient, type SkbirdConfig } from "./client"
import { fetchImageBlob } from "./http"
import { skbirdDictionary } from "./i18n"
import { createSkbirdFeedStateStore } from "./feed-state"
import { skbirdConfigStore, type SkbirdConfigStoreInstance } from "./store"
import type { SkbirdMediaAccess } from "./components/skbird-image"
import {
  createSkbirdMessagesBadge,
  SkbirdHeaderAction,
  type SkbirdHeaderActionInject,
} from "./navigation"
import {
  SkbirdIndexPage,
  type SkbirdIndexInject,
  type SkbirdIndexPageProps,
} from "./pages/index"
import { SkbirdThreadPage, type SkbirdThreadInject } from "./pages/thread"
import { SkbirdMessagesPage, type SkbirdMessagesInject } from "./pages/messages"
import { SkbirdMePage, type SkbirdMeInject } from "./pages/me"
import { SkbirdSettingsPage, type SkbirdSettingsInject } from "./pages/settings"

export const SKBIRD_PLUGIN_ID = "orahako.skbird"

export type {
  SkbirdConfigStoreInstance,
  SkbirdHeaderActionInject,
  SkbirdIndexInject,
  SkbirdIndexPageProps,
  SkbirdMediaAccess,
  SkbirdMeInject,
  SkbirdMessagesInject,
  SkbirdSettingsInject,
  SkbirdThreadInject,
}

export default definePlugin({
  manifest: validatePluginManifest(manifest),
  inject: ["ui", "slots", "router", "i18n", "http", "storage", "native"] as const,
  apply(ctx) {
    const { ui, slots, router, i18n, http, storage, native } = ctx
    i18n.register(skbirdDictionary)

    const configStore: SkbirdConfigStoreInstance = skbirdConfigStore.create(storage)
    const unread = createObservableSource(0)
    const feedState = createSkbirdFeedStateStore()

    const getClient = (): SkbirdClient | null => {
      const { token, deviceId, alias } = configStore.source.getSnapshot()
      if (!token) return null
      return new SkbirdClient(http, { token, deviceId, alias })
    }

    const media: SkbirdMediaAccess = {
      fetchImage: (url) => fetchImageBlob(http, url),
      isNative: native.isNative,
      saveImage: (blob, fileName) => native.saveImage(blob, fileName),
    }

    const pageHref = (page: string, params?: Record<string, string>): string =>
      router.href({ pluginId: SKBIRD_PLUGIN_ID, pageId: page, params })
    const openPage = (page: string, params?: Record<string, string>): void => {
      router.push({ pluginId: SKBIRD_PLUGIN_ID, pageId: page, params })
    }

    let unreadRequest: Promise<void> | undefined
    const refreshUnread = (): Promise<void> => {
      if (unreadRequest) return unreadRequest
      const config = configStore.source.getSnapshot()
      const client = getClient()
      if (!client) {
        unread.set(0)
        return Promise.resolve()
      }
      const request = client
        .unreadNum()
        .then((value) => {
          const current = configStore.source.getSnapshot()
          if (
            current.token === config.token &&
            current.deviceId === config.deviceId &&
            current.alias === config.alias
          ) {
            unread.set(value.count + value.imCount)
          }
        })
        .catch(() => {})
      unreadRequest = request
      void request.finally(() => {
        if (unreadRequest === request) unreadRequest = undefined
      })
      return request
    }

    const syncUnread = (): void => {
      if (!configStore.hydrated.getSnapshot()) return
      if (!configStore.source.getSnapshot().token) {
        unread.set(0)
        return
      }
      void refreshUnread()
    }
    const unsubscribeConfig = configStore.source.subscribe(syncUnread)
    const unsubscribeHydrated = configStore.hydrated.subscribe(syncUnread)
    syncUnread()

    ui.registerPage(
      {
        id: "index",
        title: "森空鸟",
        titleKey: "skbird.title",
        requiresProvider: false,
        dictionary: skbirdDictionary,
        store: configStore,
        inject: (): SkbirdIndexInject => ({
          hooks: {
            hydrated: configStore.hydrated,
            unread,
          },
          getClient,
          media,
          pageHref,
          openPage,
          readFeedState: () => feedState.read(),
          writeFeedState: (snapshot) => feedState.write(snapshot),
          refreshUnread,
        }),
      },
      SkbirdIndexPage
    )
    ui.registerPage(
      {
        id: "thread",
        title: "帖子详情",
        titleKey: "skbird.threadTitle",
        parent: "index",
        requiresProvider: false,
        dictionary: skbirdDictionary,
        store: configStore,
        inject: (): SkbirdThreadInject => ({
          hooks: {
            hydrated: configStore.hydrated,
            location: router.current,
          },
          getClient,
          media,
          openSettings: () => openPage("settings"),
          readThreadSnapshot: (id) =>
            feedState.read()?.threads.find((thread) => thread.threadId === id),
        }),
      },
      SkbirdThreadPage
    )
    ui.registerPage(
      {
        id: "messages",
        title: "消息",
        titleKey: "skbird.messagesTitle",
        parent: "index",
        requiresProvider: false,
        dictionary: skbirdDictionary,
        store: configStore,
        inject: (): SkbirdMessagesInject => ({
          hooks: {
            hydrated: configStore.hydrated,
          },
          getClient,
          media,
          setUnread: (count) => unread.set(count),
          openSettings: () => openPage("settings"),
        }),
      },
      SkbirdMessagesPage
    )
    ui.registerPage(
      {
        id: "me",
        title: "我的",
        titleKey: "skbird.meTitle",
        parent: "index",
        requiresProvider: false,
        dictionary: skbirdDictionary,
        store: configStore,
        inject: (): SkbirdMeInject => ({
          hooks: {
            hydrated: configStore.hydrated,
          },
          getClient,
          media,
          openSettings: () => openPage("settings"),
        }),
      },
      SkbirdMePage
    )
    ui.registerPage(
      {
        id: "settings",
        title: "森空鸟设置",
        titleKey: "skbird.settingsTitle",
        parent: "index",
        requiresProvider: false,
        dictionary: skbirdDictionary,
        store: configStore,
        inject: (): SkbirdSettingsInject => ({
          hooks: {
            hydrated: configStore.hydrated,
          },
          createClient: (config: SkbirdConfig) => new SkbirdClient(http, config),
        }),
      },
      SkbirdSettingsPage
    )

    ui.registerNavigation({
      id: "skbird",
      title: "森空鸟",
      titleKey: "skbird.nav",
      page: "index",
      icon: Bird,
      group: "extras",
    })
    ui.registerNavigation({
      id: "home",
      title: "森空鸟",
      titleKey: "skbird.nav",
      page: "index",
      icon: Bird,
      scope: "plugin",
      order: 0,
    })
    ui.registerNavigation({
      id: "messages",
      title: "消息",
      titleKey: "skbird.messagesTitle",
      page: "messages",
      icon: Bell,
      badge: createSkbirdMessagesBadge(unread),
      scope: "plugin",
      order: 10,
    })
    ui.registerNavigation({
      id: "me",
      title: "我的",
      titleKey: "skbird.meTitle",
      page: "me",
      icon: User,
      scope: "plugin",
      order: 20,
    })

    slots.inject("shell.header.actions", (slotCtx) =>
      slotCtx.slots.register(
        {
          id: "skbird-header-actions",
          slot: "shell.header.actions",
          dictionary: skbirdDictionary,
          inject: (): SkbirdHeaderActionInject => ({
            hooks: {
              location: router.current,
            },
            pluginId: SKBIRD_PLUGIN_ID,
            openSettings: () => openPage("settings"),
          }),
        },
        SkbirdHeaderAction
      )
    )

    ctx.effect(() => () => {
      unsubscribeConfig()
      unsubscribeHydrated()
      configStore.dispose()
    })
  },
})
