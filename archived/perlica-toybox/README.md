# Perlica 社区插件

外部功能插件，提供地图找车、车辆号/扫码识别、解锁与骑行控制、历史记录和账户设置。插件注册自己的页面、设置分类、插件作用域导航、顶部操作和中英文词典。

## 构建

```bash
pnpm build:plugin -- community.perlica-toybox
```

将生成的 `artifacts/community.perlica-toybox-1.0.1.zip` 通过「我的 → 插件 → 安装 ZIP」安装，或从官方插件市场安装。宿主不需要提供 Perlica 专用页面或 Store。

## 宿主能力

- HTTP：`ctx.http.send`；Web 通过 EdgeOne 代理访问 `client3.uqbike.cn`，目标 URL 使用 `x-proxy-target`，避免 Token 进入代理请求 URL。
- 凭据：`defineStore` 工厂在 `apply` 中创建，持久化到 `ctx.storage.secure` 的插件命名空间，并随 Cordis 作用域释放；不使用模块级宿主单例。
- 快照：页面数据缓存写入 `ctx.storage.local` 的插件命名空间，键为 `snapshot:<accountId>`，账号之间互相隔离；条目 12 小时后过期并自动删除。缓存只用于加速首屏的车辆、账户、历史与围栏等展示数据，不缓存进行中订单；停车/还车始终以本次会话实时 `currentOrder` 确认结果为准。写入失败不影响实时请求。
- 定位：`ctx.native.capabilities.invoke("native.geolocation", "getCurrentPosition")`；Web/PWA 或未装配该能力的宿主回退到 WebView 的 `navigator.geolocation`。Android 宿主声明定位权限；首次定位由系统询问授权。
- 扫码：`html5-qrcode` 使用相机/相册；相机走 WebView 自身的权限流程，不需要额外原生桥能力。
- 地图：包内打包 Leaflet 和样式，使用高德栅格瓦片。

## 插件契约

- 使用 `definePlugin({ manifest, inject, apply })`，`manifest` 为 API v1，入口为 `dist/index.js`。
- 页面、设置分类与顶部操作通过 `ctx.ui.registerPage`、`ctx.settings.registerCategory`、`ctx.slots.inject` 注册；组件只接收 `ui-renderer` 派生的 Props（`t`、`locale`、`useStore`、`actions`、`inject` hooks 与回调）。
- 词典使用 `defineDictionary` 并在 `apply` 中通过 `ctx.i18n.register` 注册；凭据与地图偏好在 `apply` 中通过 `defineStore` 创建并清理。
- 仅依赖公开 SDK、`@orahako/ui-primitives` 与共享 React/Sonner 模块；无 `@/` 私有导入或业务 React Context。
- 插件与应用同权。Token 只应在用户验证并保存后写入凭据存储；调试快照会继续脱敏。
- 真实骑行、支付相关操作和系统授权需要在 Android 真机上由用户验收。
