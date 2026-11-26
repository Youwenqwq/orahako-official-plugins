import type { Win98SchemeId, Win98WallpaperId } from "./store"

export interface Win98SchemeTokens {
  readonly face: string
  readonly highlight: string
  readonly light: string
  readonly shadow: string
  readonly darkShadow: string
  readonly titleActiveA: string
  readonly titleActiveB: string
  readonly titleActiveText: string
  readonly titleInactiveA: string
  readonly titleInactiveB: string
  readonly titleInactiveText: string
  readonly accent: string
  readonly accentText: string
}

export const WIN98_SCHEMES: Readonly<Record<Win98SchemeId, Win98SchemeTokens>> = {
  standard: {
    face: "#c0c0c0",
    highlight: "#ffffff",
    light: "#dfdfdf",
    shadow: "#808080",
    darkShadow: "#000000",
    titleActiveA: "#000080",
    titleActiveB: "#1084d0",
    titleActiveText: "#ffffff",
    titleInactiveA: "#808080",
    titleInactiveB: "#b5b5b5",
    titleInactiveText: "#dfdfdf",
    accent: "#000080",
    accentText: "#ffffff",
  },
  rainy: {
    face: "#c8cfd6",
    highlight: "#ffffff",
    light: "#e2e7ec",
    shadow: "#7c8894",
    darkShadow: "#1f2933",
    titleActiveA: "#465c73",
    titleActiveB: "#7892ad",
    titleActiveText: "#ffffff",
    titleInactiveA: "#7b8794",
    titleInactiveB: "#a8b3be",
    titleInactiveText: "#e5e9ed",
    accent: "#465c73",
    accentText: "#ffffff",
  },
  rose: {
    face: "#d4c5c9",
    highlight: "#fff7f9",
    light: "#e8dde0",
    shadow: "#8f757c",
    darkShadow: "#2b1b20",
    titleActiveA: "#8c465c",
    titleActiveB: "#c27a90",
    titleActiveText: "#ffffff",
    titleInactiveA: "#947c83",
    titleInactiveB: "#baa6ac",
    titleInactiveText: "#f2eaec",
    accent: "#8c465c",
    accentText: "#ffffff",
  },
  spruce: {
    face: "#c4cfc8",
    highlight: "#f7fff9",
    light: "#dde6e0",
    shadow: "#6e8275",
    darkShadow: "#17261c",
    titleActiveA: "#2b593c",
    titleActiveB: "#5a9670",
    titleActiveText: "#ffffff",
    titleInactiveA: "#738579",
    titleInactiveB: "#a2b0a7",
    titleInactiveText: "#e8f0eb",
    accent: "#2b593c",
    accentText: "#ffffff",
  },
  plum: {
    face: "#ccc5d4",
    highlight: "#faf7ff",
    light: "#e3dde8",
    shadow: "#7e708c",
    darkShadow: "#211829",
    titleActiveA: "#483063",
    titleActiveB: "#7e5aa8",
    titleActiveText: "#ffffff",
    titleInactiveA: "#82768f",
    titleInactiveB: "#ada3b8",
    titleInactiveText: "#ede9f2",
    accent: "#483063",
    accentText: "#ffffff",
  },
}

export const WIN98_WALLPAPERS: Readonly<Record<Win98WallpaperId, string>> = {
  teal: "#008080",
  clouds:
    "radial-gradient(ellipse 260px 90px at 18% 24%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0) 70%), radial-gradient(ellipse 320px 110px at 72% 18%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 72%), radial-gradient(ellipse 280px 95px at 48% 58%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%), radial-gradient(ellipse 240px 80px at 84% 68%, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0) 70%), linear-gradient(180deg, #5ea4dc 0%, #8ec5ee 52%, #bfe0f7 100%)",
  grid: "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 24px), #006d77",
  ocean: "linear-gradient(160deg, #1b4965 0%, #163a52 55%, #0f293a 100%)",
  forest: "linear-gradient(160deg, #3a5a40 0%, #2d4732 60%, #1e3322 100%)",
}

export function buildWin98Styles(schemeId: Win98SchemeId): string {
  const s = WIN98_SCHEMES[schemeId]
  return `
html[data-orahako-shell="win98"],
html[data-orahako-shell="win98"].dark,
[data-shell="win98"] {
  color-scheme: light;
  --w98-face: ${s.face};
  --w98-hi: ${s.highlight};
  --w98-light: ${s.light};
  --w98-shadow: ${s.shadow};
  --w98-dark: ${s.darkShadow};
  --w98-title-a: ${s.titleActiveA};
  --w98-title-b: ${s.titleActiveB};
  --w98-title-fg: ${s.titleActiveText};
  --w98-title-in-a: ${s.titleInactiveA};
  --w98-title-in-b: ${s.titleInactiveB};
  --w98-title-in-fg: ${s.titleInactiveText};
  --w98-accent: ${s.accent};
  --w98-accent-fg: ${s.accentText};
  --w98-font: "Tahoma", "Microsoft Sans Serif", "PingFang SC", "Noto Sans CJK SC", system-ui, sans-serif;

  /* Map host shadcn/Tailwind design tokens into crisp Windows 98 geometry (even if host is in .dark) */
  --radius: 0px;
  --background: #ecece8;
  --foreground: #000000;
  --card: ${s.face};
  --card-foreground: #000000;
  --popover: ${s.face};
  --popover-foreground: #000000;
  --primary: ${s.accent};
  --primary-foreground: ${s.accentText};
  --secondary: ${s.face};
  --secondary-foreground: #000000;
  --muted: ${s.light};
  --muted-foreground: #383838;
  --accent: ${s.light};
  --accent-foreground: #000000;
  --destructive: #a80000;
  --border: ${s.shadow};
  --input: ${s.shadow};
  --ring: ${s.accent};
  --font-sans: var(--w98-font);
  --font-heading: var(--w98-font);

  /* Classic light pastel schedule & chart palette so text is always crisp dark-on-light */
  --schedule-1: #c8efd4;
  --schedule-2: #d6f0ff;
  --schedule-3: #fff2b8;
  --schedule-4: #ffe0c2;
  --schedule-5: #ffd4dc;
  --schedule-6: #e6d6ff;
  --schedule-7: #d4e2ff;
  --schedule-8: #c8f2f0;
  --chart-1: ${s.accent};
  --chart-2: #008080;
  --chart-3: #808000;
  --chart-4: #800080;
  --chart-5: #804000;
}

html[data-orahako-shell="win98"] body {
  overflow: hidden;
  font-family: var(--w98-font);
  background: #008080;
  color: #000000;
}

/* Hide empty banner slot wrapper completely when no banner is rendered */
.w98-banner-host:not(:has(*)) {
  display: none;
}

/* Classic Win98 3D bevel primitives */
.w98-raised {
  background: var(--w98-face);
  color: #000000;
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px -2px 0 var(--w98-shadow);
}

.w98-sunken {
  background: #ffffff;
  color: #000000;
  box-shadow:
    inset 1px 1px 0 var(--w98-shadow),
    inset -1px -1px 0 var(--w98-hi),
    inset 2px 2px 0 var(--w98-dark),
    inset -2px -2px 0 var(--w98-light);
}

.w98-sunken-tray {
  background: var(--w98-face);
  color: #000000;
  box-shadow:
    inset 1px 1px 0 var(--w98-shadow),
    inset -1px -1px 0 var(--w98-hi);
}

.w98-window {
  background: var(--w98-face);
  color: #000000;
  box-shadow:
    inset 1px 1px 0 var(--w98-light),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-hi),
    inset -2px -2px 0 var(--w98-shadow),
    2px 2px 0 rgba(0, 0, 0, 0.28);
}

.w98-btn {
  background: var(--w98-face);
  color: #000000;
  border: 0;
  border-radius: 0;
  font-family: var(--w98-font);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px -2px 0 var(--w98-shadow);
}

.w98-btn:active:not(:disabled),
.w98-btn[data-active="true"] {
  box-shadow:
    inset 1px 1px 0 var(--w98-dark),
    inset -1px -1px 0 var(--w98-hi),
    inset 2px 2px 0 var(--w98-shadow),
    inset -2px -2px 0 var(--w98-light);
}

.w98-btn:focus-visible {
  outline: 1px dotted #000000;
  outline-offset: -4px;
}

.w98-task-btn-active {
  background-image:
    linear-gradient(45deg, var(--w98-hi) 25%, transparent 25%),
    linear-gradient(-45deg, var(--w98-hi) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--w98-hi) 75%),
    linear-gradient(-45deg, transparent 75%, var(--w98-hi) 75%);
  background-size: 2px 2px;
  background-position: 0 0, 0 1px, 1px -1px, -1px 0;
  background-color: var(--w98-light);
  font-weight: 700;
  box-shadow:
    inset 1px 1px 0 var(--w98-dark),
    inset -1px -1px 0 var(--w98-hi),
    inset 2px 2px 0 var(--w98-shadow),
    inset -2px -2px 0 var(--w98-light);
}

.w98-titlebar-active {
  background: linear-gradient(90deg, var(--w98-title-a) 0%, var(--w98-title-b) 100%);
  color: var(--w98-title-fg);
}

.w98-titlebar-inactive {
  background: linear-gradient(90deg, var(--w98-title-in-a) 0%, var(--w98-title-in-b) 100%);
  color: var(--w98-title-in-fg);
}

.w98-menu-item:hover {
  background: var(--w98-accent);
  color: var(--w98-accent-fg);
}

/* Classic Win98 DrawAnimatedRects wireframe zoom */
@keyframes w98-wire-zoom {
  0% {
    transform: translate3d(var(--w98-from-x), var(--w98-from-y), 0);
    width: var(--w98-from-w);
    height: var(--w98-from-h);
  }
  100% {
    transform: translate3d(var(--w98-to-x), var(--w98-to-y), 0);
    width: var(--w98-to-w);
    height: var(--w98-to-h);
  }
}

.w98-zoom-wire {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 48;
  border: 2px solid #ffffff;
  mix-blend-mode: difference;
  animation: w98-wire-zoom 150ms steps(5, end) forwards;
}

/* Indeterminate Win98 status-bar segmented blue block animation */
@keyframes w98-status-marquee {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(260%);
  }
}

.w98-status-progress {
  position: relative;
  overflow: hidden;
  width: 72px;
  height: 14px;
  background: #ffffff;
  box-shadow:
    inset 1px 1px 0 var(--w98-shadow),
    inset -1px -1px 0 var(--w98-hi);
}

.w98-status-progress-bar {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 0;
  width: 34px;
  background: repeating-linear-gradient(
    90deg,
    var(--w98-accent) 0px,
    var(--w98-accent) 6px,
    transparent 6px,
    transparent 8px
  );
  animation: w98-status-marquee 1.1s steps(10, end) infinite;
}

/* Scoped classic scrollbars inside Win98 windows */
[data-shell="win98"] *::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

[data-shell="win98"] *::-webkit-scrollbar-track {
  background: var(--w98-light);
}

[data-shell="win98"] *::-webkit-scrollbar-thumb {
  background: var(--w98-face);
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px -2px 0 var(--w98-shadow);
}

/* Harmonize Radix Portals (Dialog / Popover / Select) while Win98 shell is active */
html[data-orahako-shell="win98"] [data-slot="dialog-overlay"],
html[data-orahako-shell="win98"] [data-slot="alert-dialog-overlay"],
html[data-orahako-shell="win98"] [data-slot="drawer-overlay"] {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: rgba(0, 0, 0, 0.08) !important;
  animation: none !important;
}

html[data-orahako-shell="win98"] [data-radix-popper-content-wrapper] > *,
html[data-orahako-shell="win98"] [role="dialog"] {
  border-radius: 0 !important;
  background: var(--w98-face) !important;
  color: #000000 !important;
  border: 0 !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-light),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-hi),
    inset -2px -2px 0 var(--w98-shadow),
    3px 3px 0 rgba(0, 0, 0, 0.35) !important;
  animation: none !important;
}

/* Win98 top titlebar bar on Radix Dialogs */
@keyframes w98-modal-flash {
  0%, 50% {
    background: linear-gradient(90deg, var(--w98-title-in-a) 0%, var(--w98-title-in-b) 100%);
  }
  25%, 75%, 100% {
    background: linear-gradient(90deg, var(--w98-title-a) 0%, var(--w98-title-b) 100%);
  }
}

html[data-orahako-shell="win98"] [data-slot="dialog-content"] {
  padding-top: 34px !important;
}

html[data-orahako-shell="win98"] [data-slot="dialog-content"][data-scoped-modal="true"] {
  display: flex !important;
  flex-direction: column !important;
  max-height: calc(100% - 24px) !important;
  overflow: hidden !important;
}

html[data-orahako-shell="win98"] [data-slot="dialog-content"][data-scoped-modal="true"] > [data-slot="dialog-header"],
html[data-orahako-shell="win98"] [data-slot="dialog-content"][data-scoped-modal="true"] > [data-slot="dialog-footer"] {
  flex-shrink: 0;
}

html[data-orahako-shell="win98"] [data-slot="dialog-content"][data-scoped-modal="true"] > :not([data-slot="dialog-header"]):not([data-slot="dialog-footer"]):not([data-slot="dialog-close"]) {
  min-height: 0;
  overflow-y: auto;
  flex: 1 1 auto;
}

html[data-orahako-shell="win98"] [data-slot="dialog-content"]::before {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  height: 22px;
  background: linear-gradient(90deg, var(--w98-title-a) 0%, var(--w98-title-b) 100%);
  pointer-events: none;
}

html[data-orahako-shell="win98"] [data-slot="dialog-content"][data-modal-flash="true"]::before {
  animation: w98-modal-flash 320ms steps(1, end) 1;
}

html[data-orahako-shell="win98"] [data-slot="dialog-close"] {
  top: 6px !important;
  right: 6px !important;
  width: 18px !important;
  height: 16px !important;
  padding: 0 !important;
  border-radius: 0 !important;
  opacity: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: var(--w98-face) !important;
  color: #000000 !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px -2px 0 var(--w98-shadow) !important;
}

html[data-orahako-shell="win98"] [data-slot="dialog-close"] svg {
  width: 11px !important;
  height: 11px !important;
}

html[data-orahako-shell="win98"] [role="dialog"] [class*="rounded-"] {
  border-radius: 0 !important;
}

html[data-orahako-shell="win98"] [role="dialog"] [data-slot="button"]:not([data-variant="ghost"]):not([data-variant="link"]) {
  background: var(--w98-face) !important;
  color: #000000 !important;
  border: 0 !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px -2px 0 var(--w98-shadow) !important;
}

html[data-orahako-shell="win98"] [role="dialog"] [data-slot="button"]:not([data-variant="ghost"]):not([data-variant="link"]):active:not(:disabled) {
  background: var(--w98-light) !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-dark),
    inset -1px -1px 0 var(--w98-hi),
    inset 2px 2px 0 var(--w98-shadow),
    inset -2px -2px 0 var(--w98-light) !important;
}

html[data-orahako-shell="win98"] [role="dialog"] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
html[data-orahako-shell="win98"] [role="dialog"] textarea,
html[data-orahako-shell="win98"] [role="dialog"] [data-slot="select-trigger"] {
  background: #ffffff !important;
  color: #000000 !important;
  border: 0 !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-shadow),
    inset -1px -1px 0 var(--w98-hi),
    inset 2px 2px 0 var(--w98-dark),
    inset -2px -2px 0 var(--w98-light) !important;
}

/* Fit plugin fixed-position lightbox / image viewers cleanly inside the Win98 window viewport.
   Using container-type: size + cqw/cqh ensures max-height always resolves to the window viewport
   even when intermediate wrapper divs (like skbird's zoom wrapRef) have height: auto. */
[data-w98-page-viewport="true"] {
  container-type: size;
}

[data-w98-page-viewport="true"] .fixed {
  max-width: 100% !important;
  max-height: 100% !important;
  padding: 12px !important;
  box-sizing: border-box !important;
}

[data-w98-page-viewport="true"] .fixed img {
  max-width: calc(100cqw - 24px) !important;
  max-height: calc(100cqh - 24px) !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}

/* ============================================================================
 * Deep Win98 Interior Skin for Plugin Pages
 * Turns flat shadcn/Tailwind pages into authentic Win98 desktop applications.
 * ============================================================================ */
[data-w98-page-viewport="true"] {
  font-family: var(--w98-font);
  font-size: 12px;
  color: #000000;
  background: #e6e6e2;
}

[data-w98-page-viewport="true"] [class*="rounded-"] {
  border-radius: 0 !important;
}

[data-w98-page-viewport="true"] [class*="shadow-"] {
  box-shadow: none;
}

/* Cards -> Classic Win98 raised dialog panels */
[data-w98-page-viewport="true"] [data-slot="card"] {
  background: var(--w98-face) !important;
  color: #000000 !important;
  border: 0 !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px -2px 0 var(--w98-shadow) !important;
}

/* Buttons -> Classic 3D beveled Win98 buttons */
[data-w98-page-viewport="true"] [data-slot="button"]:not([data-variant="ghost"]):not([data-variant="link"]),
[data-w98-page-viewport="true"] [data-slot="toggle-group-item"] {
  background: var(--w98-face) !important;
  color: #000000 !important;
  border: 0 !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px -2px 0 var(--w98-shadow) !important;
}

[data-w98-page-viewport="true"] [data-slot="button"][data-variant="default"] {
  font-weight: 600;
}

[data-w98-page-viewport="true"] [data-slot="button"]:not([data-variant="ghost"]):not([data-variant="link"]):active:not(:disabled),
[data-w98-page-viewport="true"] [data-slot="toggle-group-item"][data-state="on"] {
  background: var(--w98-light) !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-dark),
    inset -1px -1px 0 var(--w98-hi),
    inset 2px 2px 0 var(--w98-shadow),
    inset -2px -2px 0 var(--w98-light) !important;
}

/* Inputs, Textareas, Select Triggers -> Sunken white fields */
[data-w98-page-viewport="true"] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
[data-w98-page-viewport="true"] textarea,
[data-w98-page-viewport="true"] select,
[data-w98-page-viewport="true"] [data-slot="input"],
[data-w98-page-viewport="true"] [data-slot="select-trigger"] {
  background: #ffffff !important;
  color: #000000 !important;
  border: 0 !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-shadow),
    inset -1px -1px 0 var(--w98-hi),
    inset 2px 2px 0 var(--w98-dark),
    inset -2px -2px 0 var(--w98-light) !important;
}

/* Progress Bars -> Iconic Win98 sunken track + segmented blue blocks */
[data-w98-page-viewport="true"] [data-slot="progress"] {
  height: 16px !important;
  padding: 2px !important;
  background: #ffffff !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-shadow),
    inset -1px -1px 0 var(--w98-hi),
    inset 2px 2px 0 var(--w98-dark),
    inset -2px -2px 0 var(--w98-light) !important;
}

[data-w98-page-viewport="true"] [data-slot="progress-indicator"] {
  background: repeating-linear-gradient(
    90deg,
    var(--w98-accent) 0px,
    var(--w98-accent) 8px,
    transparent 8px,
    transparent 10px
  ) !important;
}

/* Tabs -> Classic Win98 folder tab strip */
[data-w98-page-viewport="true"] [data-slot="tabs-list"] {
  background: transparent !important;
  gap: 2px;
  padding: 0 !important;
}

[data-w98-page-viewport="true"] [data-slot="tabs-trigger"] {
  background: var(--w98-face) !important;
  color: #000000 !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px 0 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px 0 0 var(--w98-shadow) !important;
}

[data-w98-page-viewport="true"] [data-slot="tabs-trigger"][data-state="active"] {
  background: var(--w98-light) !important;
  font-weight: 700;
}

/* Tables -> Sunken white listview with raised Win98 column headers */
[data-w98-page-viewport="true"] table {
  background: #ffffff;
  border-collapse: collapse;
}

[data-w98-page-viewport="true"] th {
  background: var(--w98-face) !important;
  color: #000000 !important;
  font-weight: 600;
  font-size: 12px;
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px -2px 0 var(--w98-shadow);
}

[data-w98-page-viewport="true"] td {
  border-bottom: 1px solid #d8d8d4;
}

/* Badges -> Etched Win98 tags */
[data-w98-page-viewport="true"] [data-slot="badge"] {
  background: var(--w98-light);
  color: #000000;
  border: 1px solid var(--w98-shadow);
  box-shadow: inset 1px 1px 0 var(--w98-hi);
}

/* Separators -> Win98 2px etched groove */
[data-w98-page-viewport="true"] [data-slot="separator"] {
  background: var(--w98-shadow) !important;
  box-shadow: 0 1px 0 var(--w98-hi);
}

/* ============================================================================
 * Classic Windows System Tray Balloon Notifications (Sonner Toast)
 * Uses low-FPS stepped fade-in / fade-out instead of modern smooth web slides.
 * ============================================================================ */
@keyframes w98-balloon-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

html[data-orahako-shell="win98"] [data-sonner-toaster] {
  bottom: 44px !important;
  right: 14px !important;
  z-index: 49 !important;
  font-family: var(--w98-font) !important;
}

html[data-orahako-shell="win98"] [data-sonner-toast] {
  position: relative;
  background: #ffffe1 !important;
  color: #000000 !important;
  border: 1px solid #000000 !important;
  border-radius: 7px !important;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.28) !important;
  font-family: var(--w98-font) !important;
  font-size: 12px !important;
  padding: 10px 14px !important;
  overflow: visible !important;
  transition: opacity 220ms steps(4, end) !important;
  animation: w98-balloon-in 200ms steps(4, end) both !important;
}

html[data-orahako-shell="win98"] [data-sonner-toast][data-removed="true"] {
  opacity: 0 !important;
  transition: opacity 220ms steps(4, end) !important;
}

/* Speech-bubble pointer tail aiming down-right toward the system tray */
html[data-orahako-shell="win98"] [data-sonner-toast]:first-of-type::before {
  content: "";
  position: absolute;
  bottom: -10px;
  right: 22px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 0 solid transparent;
  border-top: 10px solid #000000;
  pointer-events: none;
}

html[data-orahako-shell="win98"] [data-sonner-toast]:first-of-type::after {
  content: "";
  position: absolute;
  bottom: -8px;
  right: 23px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 0 solid transparent;
  border-top: 8px solid #ffffe1;
  pointer-events: none;
}

html[data-orahako-shell="win98"] [data-sonner-toast] [data-title] {
  font-weight: 700 !important;
  color: #000000 !important;
}

html[data-orahako-shell="win98"] [data-sonner-toast] [data-description] {
  color: #303030 !important;
}

html[data-orahako-shell="win98"] [data-sonner-toast] [data-button] {
  background: var(--w98-face) !important;
  color: #000000 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow:
    inset 1px 1px 0 var(--w98-hi),
    inset -1px -1px 0 var(--w98-dark),
    inset 2px 2px 0 var(--w98-light),
    inset -2px -2px 0 var(--w98-shadow) !important;
}
`
}
