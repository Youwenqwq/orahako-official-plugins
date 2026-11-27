# YUNA 四皮肤主题插件

基于 [YUNA 前端与移动端设计规范](https://102.yuna.team/index/design-system/#mobile)（2026-11-27）的 Orahako 主题插件。一个 ZIP 注册四个可独立选择的主题，严格遵守移动端 **三色分离原则**（主交互 / 次强调 / 分类状态色在无 `:hover` 静态首屏均直接可见）：

| 主题 | 视觉与移动端静态层级 |
| --- | --- |
| YUNA · 102 | 蓝紫主交互 + 玫粉次强调 + 卡片底部三色循环类别条、22px 点阵、移动端厚阴影收敛为 `2px` |
| YUNA · 明日方舟 | 青蓝主交互 + 战术橙 / 琥珀黄表头与分组标签 + 2px 顶部战术四色循环色条与同色图标 + 珊瑚红眉题短线与定位条 + 荧光绿进度与状态色 |
| YUNA · 红魔馆 | 酒红 / 玫瑰主交互 + 古金 / 鎏金标题、图标与底栏高亮 + 双框铭牌（移动端收敛为紧凑双框）+ 夜间酒红/鎏金微光 |
| YUNA · 红魔馆 2.0 | 深猩红主交互 + 皇家鎏金标题与边框 + 月光钢银图标与刻度线 + 猩红火漆徽章与双色书签（移动端紧凑双框） |

四套均支持浅色、深色和跟随系统。配色来源及 CSS 哈希见 `tokens.json`。

## 移动端规范适配（`#mobile`）

- **悬停隔离与按压反馈**：桌面悬停样式以 `@media (hover: hover)` 隔离，触屏补充 `:active` 轻缩放与背景反馈。
- **字号与触控底线**：移动端表单控件（`input` / `select` / `textarea`）字号 `>= 16px` 防止 iOS Safari 聚焦放大；底栏与徽章微文案 `>= 11px`；粗指针下可点击控件 `>= 44×44px`、相邻操作间距 `>= 8px`。
- **视口、安全区与收敛**：抽屉 / 侧栏 / 弹窗使用 `dvh` 高度，顶栏与底栏适配 `env(safe-area-inset-top/bottom)`；`<= 700px` 边距收敛至 `12px`，表格容器原生横向滚动，标签栏支持原生滑动与 `scroll-snap`。

## 安装与使用

需要带 Cordis 插件系统的 Orahako 0.15.0+（兼容 0.15.0-canary）。

在插件管理中导入 `community.theme.yuna` ZIP 并启用，在外观主题页选择 `YUNA · 102`、`YUNA · 明日方舟`、`YUNA · 红魔馆` 或 `YUNA · 红魔馆 2.0`。明暗继续使用应用设置。停用插件或切回默认主题即可恢复原样；插件不自行写入主题偏好。

这是一份主题贡献，只通过公共 `ctx.ui.registerTheme()` 提供 CSS 与包内字体，不替换 Shell、不改写教务状态或登录流程，不与已有 `community.theme.arknights` 冲突。默认 Shell 及使用相同语义 Token / `data-slot` 的组件均可继承样式。

## 构建

```sh
pnpm build:plugin -- community.theme.yuna
```

构建后 ZIP 输出到 `artifacts/community.theme.yuna-1.2.2.zip`，可通过插件管理直接导入或通过 `orahako-plugin-registry` 的 `ingest` 脚本发布。

本地拉丁字形 Archivo 与 Barlow Condensed 来自规范参考包，许可证随字体放在 `assets/fonts/`（SIL OFL）。中文使用可用的 Noto Sans SC / 系统字体；红魔馆与红魔馆 2.0 使用系统衬线回退。没有附带角色或第三方品牌图片。
