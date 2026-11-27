import tokens from "./tokens.json"

export type YunaSkin = keyof typeof tokens.skins

const sans = '"Yuna Archivo", "Noto Sans SC", system-ui, sans-serif'
const serif = '"Iowan Old Style", "Palatino Linotype", "Noto Serif SC", "Songti SC", serif'

function palette(skin: YunaSkin, mode: "light" | "dark") {
  const source = tokens.skins[skin][mode]
  const onPrimary =
    mode === "light"
      ? "#ffffff"
      : skin === "102"
        ? "#111427"
        : skin === "arknights"
          ? "#11161a"
          : skin === "scarlet"
            ? "#3b1723"
            : "#210c14"
  const radius = skin === "scarlet" ? ".5rem" : skin === "scarlet2" ? "2px" : "0px"
  const heading =
    skin === "scarlet" || skin === "scarlet2"
      ? serif
      : skin === "arknights"
        ? '"Yuna Barlow Condensed", ' + sans
        : sans
  return `html${mode === "dark" ? ".dark" : ":not(.dark)"} {
    ${Object.entries(source)
      .map(([key, value]) => `--yuna-${key}: ${value};`)
      .join("\n")}
    --yuna-accent-2: var(--yuna-pink);
    --background: var(--yuna-bg);
    --foreground: var(--yuna-ink);
    --card: var(--yuna-surface);
    --card-foreground: var(--yuna-ink);
    --popover: var(--yuna-surface);
    --popover-foreground: var(--yuna-ink);
    --primary: var(--yuna-blue);
    --primary-foreground: ${onPrimary};
    --secondary: var(--yuna-surface-2);
    --secondary-foreground: var(--yuna-ink);
    --muted: var(--yuna-surface-2);
    --muted-foreground: var(--yuna-muted);
    --accent: var(--yuna-surface-2);
    --accent-foreground: var(--yuna-ink);
    --border: var(--yuna-line);
    --input: var(--yuna-muted);
    --yuna-control-border: var(--yuna-muted);
    --ring: var(--yuna-blue);
    --sidebar: var(--yuna-surface);
    --sidebar-foreground: var(--yuna-ink);
    --sidebar-primary: var(--primary);
    --sidebar-primary-foreground: var(--primary-foreground);
    --sidebar-accent: var(--yuna-surface-2);
    --sidebar-accent-foreground: var(--yuna-blue);
    --sidebar-border: var(--yuna-line);
    --sidebar-ring: var(--yuna-blue);
    --radius: ${radius};
    --font-sans: ${sans};
    --font-heading: ${heading};
  }`
}

const components = `
html body { background-color: var(--background); color: var(--foreground); font-family: var(--font-sans); }
html :is(h1, h2, h3, [data-slot="card-title"], [data-slot="dialog-title"], [data-slot="drawer-title"], [data-slot="sheet-title"]) { font-family: var(--font-heading); }
html [data-slot="card"] { border: 1px solid var(--border); border-radius: var(--radius); box-shadow: none; }
html :is([data-slot="card-header"], [data-slot="card-footer"]) { border-radius: 0; }
html :is([data-slot="button"], [data-slot="input"], [data-slot="textarea"], [data-slot="select-trigger"], [data-slot="tabs-list"], [data-slot="tabs-trigger"], [data-slot="sidebar-menu-button"], [data-slot="badge"]) { border-radius: var(--radius); }
html :is([data-slot="dialog-content"], [data-slot="dropdown-menu-content"], [data-slot="popover-content"], [data-slot="select-content"], [data-slot="sheet-content"]) { border-radius: var(--radius); }
html [data-slot="drawer-content"][data-vaul-drawer-direction="bottom"] { border-top-left-radius: var(--radius); border-top-right-radius: var(--radius); border-color: var(--border); max-height: 88dvh; padding-bottom: max(var(--safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)); }
html [data-slot="sheet-content"]:is([data-side="left"], [data-side="right"]) { max-height: 100dvh; height: 100dvh; border-color: var(--border); }
html [data-slot="dialog-content"] { max-height: 90dvh; }
html [data-slot="card-title"] { font-weight: 700; letter-spacing: -.025em; }
html [data-slot="sidebar-header"] { border-bottom: 1px solid var(--border); }
html [data-slot="sidebar-group-label"] { color: var(--yuna-accent-2); font-size: max(11px, 0.6875rem); font-weight: 700; letter-spacing: .06em; }
html [data-slot="sidebar-menu-button"][data-active="true"] { box-shadow: inset 3px 0 var(--primary); color: var(--primary); background: var(--secondary); }
html [data-shell-header] { border-bottom: 1px solid var(--border); padding-top: max(var(--safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)); }
html [data-shell-header] h1 { font-family: var(--font-heading); }
html [data-shell-bottom-nav] { border-top: 1px solid var(--border); padding-bottom: max(var(--safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)); }
html [data-shell-bottom-nav] a { font-size: max(11px, 0.6875rem); line-height: 1.25; min-height: 48px; }
html [data-shell-bottom-nav] a[aria-current="page"] { box-shadow: inset 0 2.5px 0 var(--primary); color: var(--primary); font-weight: 700; }
html [data-slot="badge"] { font-size: max(11px, 0.6875rem); }
html [data-slot="table-container"] { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
html [data-slot="table-header"] { background: var(--secondary); border-bottom: 1.5px solid var(--yuna-accent-2); }
html [data-slot="table-head"] { color: var(--primary); }
html :is(button, a, input, select, textarea):focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }
html :is([data-slot="input"], [data-slot="textarea"]) { background-color: var(--card); }
/* --input is also shadcn's unchecked fill. State fills must be explicit so a
   bright border token cannot make a disabled feature look enabled. */
html [data-slot="switch"] {
  --yuna-switch-size: 18px;
  --yuna-switch-travel: 18px;
  box-sizing: border-box;
  width: 44px;
  height: 26px;
  padding: 2px;
  border: 2px solid var(--yuna-control-border);
  border-radius: 999px;
  background: var(--secondary);
  color: var(--foreground);
}
html [data-slot="switch"][data-size="sm"] {
  --yuna-switch-size: 14px;
  --yuna-switch-travel: 14px;
  width: 36px;
  height: 22px;
}
html [data-slot="switch"] [data-slot="switch-thumb"] {
  width: var(--yuna-switch-size);
  height: var(--yuna-switch-size);
  border-radius: 50%;
  background: var(--foreground);
  translate: none;
  transform: translateX(0);
  box-shadow: 0 1px 2px #0003;
}
html [data-slot="switch"]:is([data-state="checked"], [data-checked]) {
  border-color: var(--primary);
  background: var(--primary);
}
html [data-slot="switch"]:is([data-state="checked"], [data-checked]) [data-slot="switch-thumb"] {
  background: var(--primary-foreground);
  transform: translateX(var(--yuna-switch-travel));
}
html [data-slot="switch"]:is([data-state="checked"], [data-checked])::before {
  content: "";
  position: absolute;
  left: 7px;
  width: 5px;
  height: 9px;
  border-right: 2px solid var(--primary-foreground);
  border-bottom: 2px solid var(--primary-foreground);
  transform: translateY(-1px) rotate(45deg);
  pointer-events: none;
}
html[dir="rtl"] [data-slot="switch"]:is([data-state="checked"], [data-checked]) [data-slot="switch-thumb"] {
  transform: translateX(calc(-1 * var(--yuna-switch-travel)));
}
html[dir="rtl"] [data-slot="switch"]::before { left: auto; right: 7px; }
html :is([data-slot="checkbox"], [data-slot="radio-group-item"]) {
  border: 2px solid var(--yuna-control-border);
  background: var(--card);
  color: var(--foreground);
}
html :is([data-slot="checkbox"], [data-slot="radio-group-item"]):is([data-state="checked"], [data-checked]) {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--primary-foreground);
}
html [data-slot="button"]:is([data-variant="outline"], [data-variant="secondary"]) {
  border: 1px solid var(--yuna-control-border);
  background: var(--card);
  color: var(--foreground);
}
html [data-slot="button"][data-variant="destructive"] { border: 1px solid currentColor; }
html :is([data-slot="toggle"], [data-slot="toggle-group-item"], [data-slot="tabs-trigger"]) {
  border: 1px solid var(--yuna-control-border);
  background: var(--card);
  color: var(--foreground);
}
html :is([data-slot="toggle"], [data-slot="toggle-group-item"], [data-slot="tabs-trigger"]):is([data-state="on"], [data-state="active"], [aria-pressed="true"]) {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--primary-foreground);
  box-shadow: inset 0 -2px 0 currentColor;
}
html :is([data-slot="button"], [data-slot="toggle"], [data-slot="toggle-group-item"], [data-slot="switch"]):is(:disabled, [data-disabled]) {
  opacity: .45;
  cursor: not-allowed;
}
/* Isolate hover effects to true hover-capable pointers so mobile touch never sticks. */
@media (hover: hover) {
  html [data-slot="table-row"]:has(td):hover { background: var(--secondary); }
  html [data-slot="button"][data-variant="default"]:not(:disabled):hover { background: var(--yuna-wine); color: #fff; }
  html [data-slot="button"]:is([data-variant="outline"], [data-variant="secondary"]):not(:disabled):hover {
    border-color: var(--primary);
    background: var(--secondary);
    color: var(--primary);
  }
}
/* Active press feedback for touch and pointer devices. */
html [data-slot="button"]:not(:disabled):active {
  transform: scale(0.97);
  filter: brightness(1.06);
}
html :is([data-slot="tabs-trigger"], [data-slot="toggle"], [data-slot="toggle-group-item"], [data-slot="sidebar-menu-button"], [data-shell-bottom-nav] a, [data-shell-back]):active {
  transform: scale(0.97);
  background-color: var(--secondary);
}
html [data-slot="table-row"]:has(td):active { background: var(--secondary); }
/* Mobile & touch ergonomics: >= 44x44px hit targets, >= 8px gaps, >= 16px form inputs. */
@media (pointer: coarse) {
  html :is([data-slot="input"], [data-slot="textarea"], [data-slot="select-trigger"], [data-slot="sidebar-menu-button"], [data-slot="tabs-trigger"], [data-slot="toggle"], [data-slot="toggle-group-item"], [data-slot="dropdown-menu-item"], [data-slot="select-item"]) {
    min-height: 44px;
  }
  html :is([data-slot="button"], [data-shell-back], [data-shell-theme-toggle]) {
    min-width: 44px;
    min-height: 44px;
  }
  html [data-shell-bottom-nav] a { min-width: 44px; min-height: 48px; }
  html :is([data-shell-header] > div:last-child, [data-slot="card-footer"], [data-slot="dialog-footer"], [data-slot="drawer-footer"], [data-slot="sheet-footer"], [data-slot="tabs-list"]) {
    gap: max(8px, 0.5rem);
  }
}
@media (max-width: 767px), (pointer: coarse) {
  html :is(input, select, textarea, [data-slot="input"], [data-slot="textarea"], [data-slot="select-trigger"]) {
    font-size: max(16px, 1rem);
  }
}
@media (max-width: 700px) {
  html [data-shell-page-outlet] { padding-inline: 12px; }
  html [data-slot="table"] :is(th, td) { padding: 10px 8px; }
  html [data-slot="tabs-list"] {
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
  }
  html [data-slot="tabs-trigger"] { scroll-snap-align: start; flex-shrink: 0; }
}
@media (max-width: 480px) {
  html [data-shell-header] { padding-inline: 12px; gap: 8px; }
  html [data-shell-header] h1 { font-size: 0.9375rem; }
}
@media (prefers-reduced-motion: reduce) {
  html *, html *::before, html *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
@media (forced-colors: active) {
  html [data-slot="sidebar-menu-button"][data-active="true"] { outline: 2px solid Highlight; outline-offset: -2px; }
  html [data-shell-bottom-nav] a[aria-current="page"] { outline: 2px solid Highlight; outline-offset: -2px; }
  html [data-slot="switch"] { border-color: ButtonText; background: Canvas; }
  html [data-slot="switch"] [data-slot="switch-thumb"] { background: ButtonText; }
  html [data-slot="switch"]:is([data-state="checked"], [data-checked]) { border-color: Highlight; background: Highlight; }
  html [data-slot="switch"]:is([data-state="checked"], [data-checked]) [data-slot="switch-thumb"] { background: HighlightText; }
  html [data-slot="switch"]:is([data-state="checked"], [data-checked])::before { border-color: HighlightText; }
}
`

const structure: Record<YunaSkin, string> = {
  "102": `
    html body { background-image: radial-gradient(var(--yuna-line) .75px, transparent .75px); background-size: 22px 22px; }
    html [data-slot="card"] {
      --yuna-card-accent: var(--yuna-blue);
      box-shadow: 4px 4px 0 var(--secondary);
      border-bottom: 2px solid var(--yuna-card-accent);
    }
    html [data-slot="card"]:nth-of-type(3n + 2) { --yuna-card-accent: var(--yuna-pink); }
    html [data-slot="card"]:nth-of-type(3n) { --yuna-card-accent: var(--yuna-blue-soft); }
    html [data-slot="card-header"] svg { color: var(--yuna-card-accent); }
    html [data-slot="card-title"] { color: var(--foreground); }
    html [data-slot="badge"]:not([data-variant="destructive"]) {
      border: 1px solid color-mix(in srgb, var(--yuna-pink) 45%, var(--border));
      color: var(--yuna-pink);
    }
    html [data-slot="sidebar-menu-button"][data-active="true"] {
      box-shadow: inset 3px 0 var(--yuna-pink);
    }
    html [data-shell-header] { border-bottom: 2px solid var(--yuna-blue); }
    html [data-shell-bottom-nav] { border-top: 1px solid var(--yuna-line); }
    html [data-shell-bottom-nav] a[aria-current="page"] {
      box-shadow: inset 0 3px 0 var(--yuna-pink);
      color: var(--yuna-blue);
    }
    html:not(.dark) [data-slot="table-head"] { color: #34459f; }
    html.dark [data-slot="table-head"] { color: #cbd0ff; }
    html [data-slot="table-header"] { border-bottom: 2px solid var(--yuna-pink); }
    @media (max-width: 700px) {
      html [data-slot="card"] { box-shadow: 2px 2px 0 var(--secondary); }
    }
  `,
  arknights: `
    html body { background-image: linear-gradient(var(--yuna-ark-grid) 1px, transparent 1px), linear-gradient(90deg, var(--yuna-ark-grid) 1px, transparent 1px); background-size: 48px 48px; }
    html.dark body {
      background-image:
        linear-gradient(var(--yuna-ark-grid) 1px, transparent 1px),
        linear-gradient(90deg, var(--yuna-ark-grid) 1px, transparent 1px),
        radial-gradient(ellipse 62% 46% at 88% 8%, rgba(54, 209, 238, .10), transparent 56%),
        radial-gradient(ellipse 48% 42% at 8% 84%, rgba(244, 198, 61, .07), transparent 54%);
      background-size: 48px 48px, 48px 48px, 100% 100%, 100% 100%;
    }
    /* Tactical 4-color cycling top strip & matching icon (always visible, no single-cyan collapse). */
    html [data-slot="card"] {
      --ark-card-accent: var(--yuna-blue);
      border-top: 2px solid color-mix(in srgb, var(--ark-card-accent) 82%, var(--border));
    }
    html [data-slot="card"]:nth-of-type(4n + 2) { --ark-card-accent: var(--yuna-ark-accent-amber); }
    html [data-slot="card"]:nth-of-type(4n + 3) { --ark-card-accent: var(--yuna-ark-accent-lime); }
    html [data-slot="card"]:nth-of-type(4n) { --ark-card-accent: var(--yuna-ark-highlight); }
    html [data-slot="card-header"] svg { color: var(--ark-card-accent); }
    html [data-slot="card-title"] { letter-spacing: .02em; }
    html [data-slot="table-head"] { color: var(--yuna-pink); letter-spacing: .04em; }
    html [data-slot="table-header"] { border-bottom: 2px solid var(--yuna-pink); }
    html [data-slot="sidebar-group-label"] { color: var(--yuna-pink); }
    html [data-slot="sidebar-menu-button"][data-active="true"] {
      box-shadow: inset 3px 0 var(--yuna-ark-highlight), inset 5px 0 var(--yuna-blue);
    }
    html [data-shell-header] { border-bottom: 1.5px solid var(--yuna-line); }
    html [data-shell-header] h1::before {
      content: "";
      display: inline-block;
      width: 3px;
      height: 0.9em;
      margin-right: 8px;
      vertical-align: -0.1em;
      background: var(--yuna-ark-highlight);
    }
    html [data-shell-bottom-nav] { border-top: 1.5px solid var(--yuna-line); }
    html [data-shell-bottom-nav] a[aria-current="page"] {
      box-shadow: inset 0 2.5px 0 var(--yuna-ark-highlight);
      color: var(--yuna-blue);
    }
    html [data-slot="badge"]:not([data-variant="destructive"]) {
      border: 1px solid color-mix(in srgb, var(--yuna-ark-accent-lime) 55%, var(--border));
      color: var(--yuna-ark-accent-lime);
    }
    html [data-slot="progress-indicator"] { background: var(--yuna-ark-lime); }
    @media (prefers-contrast: more), (prefers-reduced-transparency: reduce), (forced-colors: active) {
      html.dark body { background-image: linear-gradient(var(--yuna-ark-grid) 1px, transparent 1px), linear-gradient(90deg, var(--yuna-ark-grid) 1px, transparent 1px); background-size: 48px 48px; }
    }
  `,
  scarlet: `
    html.dark body {
      background-image:
        radial-gradient(ellipse 64% 46% at 86% 6%, rgba(164, 33, 65, .18), transparent 58%),
        radial-gradient(ellipse 50% 42% at 10% 88%, rgba(223, 190, 130, .09), transparent 55%);
    }
    html [data-slot="card"] { border-color: var(--yuna-scarlet-frame); box-shadow: inset 0 0 0 4px var(--card), inset 0 0 0 5px var(--yuna-scarlet-frame); }
    html [data-slot="card-header"] { padding-top: 4px; }
    html [data-slot="card-header"] svg { color: var(--yuna-scarlet-gold); }
    html [data-slot="card-title"] { color: var(--yuna-scarlet-gold); }
    html [data-slot="sidebar-header"] { border-color: var(--yuna-scarlet-frame); }
    html [data-slot="sidebar-group-label"] { color: var(--yuna-scarlet-gold); }
    html [data-slot="sidebar-menu-button"][data-active="true"] {
      box-shadow: inset 3px 0 var(--yuna-scarlet-gold);
      color: var(--primary);
    }
    html [data-slot="table-header"] { border-bottom: 1.5px solid var(--yuna-scarlet-frame); }
    html [data-slot="table-head"] { color: var(--yuna-scarlet-gold); }
    html [data-shell-header] { border-bottom: 1px solid var(--yuna-scarlet-frame); }
    html [data-shell-bottom-nav] { border-top: 1px solid var(--yuna-scarlet-frame); }
    html [data-shell-bottom-nav] a[aria-current="page"] {
      box-shadow: inset 0 2.5px 0 var(--yuna-scarlet-gold);
      color: var(--primary);
    }
    html [data-shell-bottom-nav] a[aria-current="page"] svg { color: var(--yuna-scarlet-gold); }
    html [data-slot="badge"]:not([data-variant="destructive"]) {
      border: 1px solid var(--yuna-scarlet-frame);
      color: var(--yuna-scarlet-gold);
    }
    @media (max-width: 700px) {
      html [data-slot="card"] {
        box-shadow: inset 0 0 0 2px var(--card), inset 0 0 0 3px color-mix(in srgb, var(--yuna-scarlet-frame) 75%, transparent);
      }
    }
    @media (prefers-contrast: more), (prefers-reduced-transparency: reduce), (forced-colors: active) {
      html.dark body { background-image: none; }
    }
  `,
  scarlet2: `
    html:not(.dark) body {
      background-image:
        radial-gradient(ellipse 68% 48% at 86% 6%, rgba(156, 20, 56, .15), transparent 58%),
        radial-gradient(ellipse 52% 42% at 10% 86%, rgba(74, 96, 120, .11), transparent 55%);
    }
    html.dark body {
      background-image:
        radial-gradient(ellipse 70% 50% at 85% 4%, rgba(184, 29, 68, .24), transparent 56%),
        radial-gradient(ellipse 55% 45% at 8% 88%, rgba(166, 190, 214, .09), transparent 54%);
    }
    html [data-slot="card"] {
      border-color: var(--yuna-scarlet-frame);
      border-radius: 4px;
      box-shadow:
        inset 0 0 0 5px var(--card),
        inset 0 0 0 6px color-mix(in srgb, var(--yuna-scarlet-frame) 48%, transparent),
        0 10px 26px rgba(33, 12, 20, .08);
    }
    html.dark [data-slot="card"] {
      box-shadow:
        inset 0 0 0 5px var(--card),
        inset 0 0 0 6px color-mix(in srgb, var(--yuna-scarlet-frame) 55%, transparent),
        0 14px 34px rgba(0, 0, 0, .38);
    }
    html [data-slot="card-header"] { padding-top: 4px; }
    html [data-slot="card-header"] svg { color: var(--yuna-sakuya-silver); }
    html [data-slot="card-title"] { color: var(--yuna-scarlet-gold); letter-spacing: .04em; }
    html [data-slot="sidebar-header"] { border-color: var(--yuna-scarlet-frame); }
    html [data-slot="sidebar-group-label"] { color: var(--yuna-sakuya-silver); }
    html [data-slot="sidebar-menu-button"][data-active="true"] {
      box-shadow: inset 3px 0 var(--yuna-remilia-crimson), inset 5px 0 var(--yuna-scarlet-gold);
      color: var(--yuna-scarlet-gold);
    }
    html [data-slot="separator"] { background-color: color-mix(in srgb, var(--yuna-sakuya-silver) 38%, var(--border)); }
    html [data-slot="badge"]:not([data-variant="destructive"]) {
      border: 1px solid var(--yuna-remilia-crimson);
      box-shadow: inset 3px 0 0 var(--yuna-remilia-crimson);
      color: var(--yuna-scarlet-gold);
    }
    html [data-shell-header] { border-bottom: 1px solid var(--yuna-scarlet-frame); }
    html [data-shell-bottom-nav] { border-top: 1px solid var(--yuna-scarlet-frame); }
    html [data-shell-bottom-nav] a:not([aria-current="page"]) svg { color: var(--yuna-sakuya-silver); }
    html [data-shell-bottom-nav] a[aria-current="page"] {
      box-shadow: inset 0 2px 0 var(--yuna-remilia-crimson), inset 0 4px 0 var(--yuna-scarlet-gold);
      color: var(--yuna-scarlet-gold);
    }
    html [data-slot="table-header"] { border-bottom: 2px solid var(--yuna-scarlet-frame); }
    html.dark [data-slot="table-header"] { background: var(--yuna-s2-velvet); }
    html [data-slot="table-head"] { color: var(--yuna-scarlet-gold); letter-spacing: .1em; text-transform: uppercase; }
    @media (hover: hover) {
      html [data-slot="table-row"]:has(td):is(:hover, :focus-within) td:first-child {
        box-shadow: inset 4px 0 var(--yuna-remilia-crimson), inset 6px 0 var(--yuna-scarlet-gold);
      }
      html [data-slot="button"][data-variant="default"]:not(:disabled):hover {
        background: linear-gradient(135deg, #5a0e25, #2e0714);
        border-color: var(--yuna-scarlet-gold);
        color: var(--yuna-s2-ivory);
      }
    }
    html [data-slot="button"]:is([data-variant="outline"], [data-variant="secondary"]) {
      border-color: var(--yuna-scarlet-frame);
    }
    html :is([data-slot="dialog-content"], [data-slot="dropdown-menu-content"], [data-slot="popover-content"], [data-slot="select-content"], [data-slot="sheet-content"]) {
      border-color: var(--yuna-scarlet-frame);
      box-shadow:
        0 16px 36px rgba(14, 5, 9, .28),
        inset 0 0 0 3px var(--popover),
        inset 0 0 0 4px color-mix(in srgb, var(--yuna-scarlet-frame) 35%, transparent);
    }
    @media (max-width: 700px) {
      html [data-slot="card"] {
        box-shadow:
          inset 0 0 0 2px var(--card),
          inset 0 0 0 3px color-mix(in srgb, var(--yuna-scarlet-frame) 55%, transparent),
          0 4px 12px rgba(33, 12, 20, .08);
      }
      html.dark [data-slot="card"] {
        box-shadow:
          inset 0 0 0 2px var(--card),
          inset 0 0 0 3px color-mix(in srgb, var(--yuna-scarlet-frame) 62%, transparent),
          0 6px 16px rgba(0, 0, 0, .32);
      }
    }
    @media (prefers-contrast: more), (prefers-reduced-transparency: reduce), (forced-colors: active) {
      html body { background-image: none; }
    }
  `,
}

export function createThemeCss(skin: YunaSkin, assetUrl: (path: string) => string | undefined) {
  const archivo = assetUrl("assets/fonts/archivo-latin.woff2")
  const barlow =
    skin === "arknights" ? assetUrl("assets/fonts/barlow-condensed-bold.ttf") : undefined
  if (!archivo || (skin === "arknights" && !barlow))
    throw new Error("YUNA theme font asset is missing")
  const fonts = `
    @font-face { font-family: "Yuna Archivo"; font-style: normal; font-weight: 500 900; font-display: swap; src: url(${JSON.stringify(archivo)}) format("woff2"); }
    ${barlow ? `@font-face { font-family: "Yuna Barlow Condensed"; font-style: normal; font-weight: 700; font-display: swap; src: url(${JSON.stringify(barlow)}) format("truetype"); }` : ""}
  `
  return [fonts, palette(skin, "light"), palette(skin, "dark"), components, structure[skin]].join(
    "\n"
  )
}
