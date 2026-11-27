# YUNA 四皮肤主题插件

基于 [YUNA 前端设计规范](https://102.yuna.team/index/design-system/)（2026-11-27）的 Orahako 主题插件。一个 ZIP 注册四个可独立选择的主题：

| 主题 | 视觉 |
| --- | --- |
| YUNA · 102 | 蓝紫与粉色、直角卡片、22px 点阵、偏移阴影 |
| YUNA · 明日方舟 | 冷钢蓝黑与青蓝 / 琥珀黄、48px 工程网格、窄体标题、功能色边条 |
| YUNA · 红魔馆 | 暖纸 / 酒红、古金双框、衬线标题、适量圆角 |
| YUNA · 红魔馆 2.0 | 哥特礼堂象牙大理石 / 永夜黑曜天鹅绒、鎏金双框、猩红 + 鎏金档案书签、月光银辅色 |

四套均支持浅色、深色和跟随系统。配色来源及 CSS 哈希见 `tokens.json`，红魔馆与红魔馆 2.0 均遵循最新线上规范支持浅深双模式。

## 安装与使用

需要带 Cordis 插件系统的 Orahako 0.15.0+。

在插件管理中导入 `community.theme.yuna` ZIP 并启用，在外观主题页选择 `YUNA · 102`、`YUNA · 明日方舟`、`YUNA · 红魔馆` 或 `YUNA · 红魔馆 2.0`。明暗继续使用应用设置。停用插件或切回默认主题即可恢复原样；插件不自行写入主题偏好。

这是一份主题贡献，只通过公共 `ctx.ui.registerTheme()` 提供 CSS 与包内字体，不替换 Shell、不改写教务状态或登录流程，不与已有 `community.theme.arknights` 冲突。默认 Shell 及使用相同语义 Token / `data-slot` 的组件均可继承样式。

已适配卡片、导航、表格、表单、弹层、焦点与减少动态效果；粗指针下默认表单控件和常用按钮至少 44px 高。课程分类、图表与危险操作保留宿主语义。无粒子循环或远程字体请求。

## 构建

```sh
pnpm build:plugin -- community.theme.yuna
```

构建后 ZIP 输出到 `artifacts/community.theme.yuna-1.1.0.zip`，可通过插件管理直接导入或通过 `orahako-plugin-registry` 的 `ingest` 脚本发布。

本地拉丁字形 Archivo 与 Barlow Condensed 来自规范参考包，许可证随字体放在 `assets/fonts/`（SIL OFL）。中文使用可用的 Noto Sans SC / 系统字体；红魔馆与红魔馆 2.0 使用系统衬线回退。没有附带角色或第三方品牌图片。
