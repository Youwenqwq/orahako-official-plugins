export const IOS6_GLOBAL_CSS = `
.ios6-root {
  --ios6-safe-top: max(var(--safe-area-inset-top, 0px), env(safe-area-inset-top, 0px));
  --ios6-safe-bottom: max(var(--safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px));
  --ios6-safe-left: max(var(--safe-area-inset-left, 0px), env(safe-area-inset-left, 0px));
  --ios6-safe-right: max(var(--safe-area-inset-right, 0px), env(safe-area-inset-right, 0px));
  font-family: "Helvetica Neue", Helvetica, Arial, -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  color: #ffffff;
}

.ios6-desktop-stage {
  background-color: #212429;
  background-image:
    radial-gradient(circle at 50% 25%, rgba(92, 128, 178, 0.22), transparent 60%),
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.015) 0px,
      rgba(255, 255, 255, 0.015) 1px,
      transparent 1px,
      transparent 4px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(0, 0, 0, 0.14) 0px,
      rgba(0, 0, 0, 0.14) 1px,
      transparent 1px,
      transparent 4px
    );
}

/* Iconic iOS 6 Wallpapers (Pure CSS + Inline SVG patterns, zero external assets) */
.ios6-wallpaper-droplets {
  background-color: #28567c;
  background-image:
    radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.42) 0px, rgba(255, 255, 255, 0.06) 8px, rgba(9, 25, 43, 0.24) 10px, transparent 12px),
    radial-gradient(circle at 74% 24%, rgba(255, 255, 255, 0.36) 0px, rgba(255, 255, 255, 0.04) 11px, rgba(7, 20, 36, 0.28) 13px, transparent 15px),
    radial-gradient(circle at 46% 36%, rgba(255, 255, 255, 0.46) 0px, rgba(255, 255, 255, 0.05) 7px, rgba(9, 24, 42, 0.24) 9px, transparent 11px),
    radial-gradient(circle at 15% 58%, rgba(255, 255, 255, 0.32) 0px, rgba(255, 255, 255, 0.03) 14px, rgba(7, 20, 36, 0.26) 17px, transparent 20px),
    radial-gradient(circle at 82% 62%, rgba(255, 255, 255, 0.38) 0px, rgba(255, 255, 255, 0.05) 9px, rgba(9, 25, 43, 0.25) 11px, transparent 13px),
    radial-gradient(circle at 38% 76%, rgba(255, 255, 255, 0.36) 0px, rgba(255, 255, 255, 0.04) 12px, rgba(7, 20, 36, 0.28) 15px, transparent 18px),
    radial-gradient(circle at 64% 48%, rgba(255, 255, 255, 0.45) 0px, rgba(255, 255, 255, 0.05) 5px, rgba(9, 25, 43, 0.2) 6.5px, transparent 8px),
    radial-gradient(ellipse at 50% 15%, #5b93be 0%, #346994 46%, #1c3e5e 100%);
}

.ios6-wallpaper-wave {
  background-color: #16497a;
  background-image:
    radial-gradient(ellipse 140% 55% at 50% 18%, rgba(126, 212, 255, 0.52) 0%, transparent 64%),
    radial-gradient(ellipse 120% 60% at 15% 75%, rgba(45, 165, 232, 0.45) 0%, transparent 62%),
    radial-gradient(ellipse 110% 50% at 85% 60%, rgba(20, 102, 184, 0.65) 0%, transparent 65%),
    linear-gradient(175deg, #2b83cb 0%, #175493 48%, #0c2b54 100%);
}

.ios6-wallpaper-linen {
  background-color: #2f3338;
  background-image:
    radial-gradient(circle at 50% 25%, rgba(255, 255, 255, 0.08), transparent 68%),
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.03) 0px,
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px,
      transparent 3px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.18) 0px,
      rgba(0, 0, 0, 0.18) 1px,
      transparent 1px,
      transparent 3px
    );
}

.ios6-wallpaper-aurora {
  background-color: #0e1d36;
  background-image:
    radial-gradient(ellipse 95% 45% at 28% 24%, rgba(78, 224, 178, 0.44) 0%, transparent 62%),
    radial-gradient(ellipse 90% 50% at 72% 40%, rgba(78, 152, 245, 0.42) 0%, transparent 65%),
    radial-gradient(ellipse 100% 45% at 50% 88%, rgba(56, 78, 168, 0.45) 0%, transparent 65%),
    linear-gradient(180deg, #0b1629 0%, #102442 52%, #07101f 100%);
}

.ios6-wallpaper-leather {
  background-color: #462e1c;
  background-image:
    radial-gradient(ellipse at 50% 20%, rgba(164, 114, 72, 0.34), transparent 72%),
    repeating-linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.14) 0px,
      rgba(0, 0, 0, 0.14) 1px,
      transparent 1px,
      transparent 3px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(255, 224, 192, 0.04) 0px,
      rgba(255, 224, 192, 0.04) 1px,
      transparent 1px,
      transparent 3px
    );
}

/* Status Bar */
.ios6-status-bar {
  background: linear-gradient(180deg, rgba(64, 68, 74, 0.92) 0%, rgba(28, 30, 34, 0.94) 50%, rgba(12, 13, 16, 0.96) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.8);
}

/* Lock Screen Top Clock Panel & Bottom Slide Track */
.ios6-lock-top-panel {
  background: linear-gradient(180deg, rgba(48, 52, 58, 0.78) 0%, rgba(18, 20, 24, 0.78) 52%, rgba(8, 10, 12, 0.82) 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.26);
  border-bottom: 1px solid rgba(0, 0, 0, 0.75);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.42);
}

.ios6-lock-bottom-panel {
  background: linear-gradient(180deg, rgba(48, 52, 58, 0.84) 0%, rgba(22, 24, 28, 0.9) 50%, rgba(10, 12, 14, 0.94) 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.45);
}

.ios6-slide-track {
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  background: linear-gradient(180deg, #0b0c0e 0%, #1d2024 45%, #2b2f35 100%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    inset 0 2px 5px rgba(0, 0, 0, 0.9),
    0 1px 0 rgba(255, 255, 255, 0.14);
}

.ios6-slide-knob {
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
  background: linear-gradient(180deg, #ffffff 0%, #e1e4e8 48%, #c7ccd2 52%, #e9ecef 100%);
  border: 1px solid #484d54;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 2px 6px rgba(0, 0, 0, 0.55);
}

@keyframes ios6-shimmer {
  0% {
    background-position: 160% 0;
  }
  100% {
    background-position: -60% 0;
  }
}

.ios6-slide-text {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.34) 0%,
    rgba(255, 255, 255, 0.34) 36%,
    rgba(255, 255, 255, 0.98) 50%,
    rgba(255, 255, 255, 0.34) 64%,
    rgba(255, 255, 255, 0.34) 100%
  );
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ios6-shimmer 2.8s linear infinite;
}

/* Badge */
.ios6-badge {
  background: linear-gradient(180deg, #ff7168 0%, #df1d14 52%, #b00b04 100%);
  border: 2px solid #ffffff;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.55),
    inset 0 1px 1px rgba(255, 255, 255, 0.65);
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.45);
}

/* SpringBoard Icon Label */
.ios6-icon-label {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.92), 0 0 4px rgba(0, 0, 0, 0.55);
}

/* 3D Perspective Frosted Glass Dock */
.ios6-dock-shelf {
  position: relative;
}

.ios6-dock-shelf::before {
  content: "";
  position: absolute;
  left: -4%;
  right: -4%;
  bottom: 0;
  height: calc(54px + var(--ios6-dock-safe-bottom, 0px));
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.48) 0%,
    rgba(225, 232, 240, 0.3) 14%,
    rgba(162, 174, 188, 0.28) 55%,
    rgba(88, 98, 110, 0.44) 100%
  );
  border-top: 1px solid rgba(255, 255, 255, 0.68);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.52),
    0 -2px 10px rgba(0, 0, 0, 0.35);
  transform: perspective(360px) rotateX(28deg);
  transform-origin: bottom center;
  pointer-events: none;
}

/* Classic UINavigationBar */
.ios6-navbar {
  background: linear-gradient(180deg, #a7bfd9 0%, #7d9cbe 49%, #6989ae 51%, #55759b 100%);
  border-bottom: 1px solid #2d3e53;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    0 1px 3px rgba(0, 0, 0, 0.25);
}

.ios6-navbar-title {
  color: #ffffff;
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.52);
}

.ios6-nav-btn {
  background: linear-gradient(180deg, #8ba8c8 0%, #5b7ca3 50%, #486990 52%, #59799f 100%);
  border: 1px solid #2f4662;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 1px 0 rgba(255, 255, 255, 0.25);
  color: #ffffff;
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.48);
}

.ios6-nav-btn:active {
  background: linear-gradient(180deg, #435f82 0%, #375070 100%);
}

.ios6-nav-btn-primary {
  background: linear-gradient(180deg, #62a5f5 0%, #266dd2 50%, #1c5bc0 52%, #2b6cd3 100%);
  border: 1px solid #133c7f;
}

/* Classic Grouped UITableView Pin-Stripe Background */
.ios6-pinstripe-bg {
  background-color: #cbd2d8;
  background-image: repeating-linear-gradient(
    90deg,
    #cbd2d8 0px,
    #cbd2d8 5px,
    #c4ccd3 5px,
    #c4ccd3 7px
  );
  color: #1c222b;
}

.ios6-grouped-card {
  background: #ffffff;
  border: 1px solid #a6adb5;
  border-radius: 10px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.85);
}

.ios6-section-header {
  color: #4c566c;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* Classic Skeuomorphic UISwitch */
.ios6-switch-track {
  border: 1px solid #7c848e;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.35),
    0 1px 0 rgba(255, 255, 255, 0.7);
  transition: background-color 0.2s ease;
}

.ios6-switch-track-on {
  background: linear-gradient(180deg, #1b6bd6 0%, #4292f4 55%, #65aaf7 100%);
  border-color: #1752a3;
}

.ios6-switch-track-off {
  background: linear-gradient(180deg, #c7ccd1 0%, #eef0f2 60%, #ffffff 100%);
}

.ios6-switch-thumb {
  background: linear-gradient(180deg, #fcfcfc 0%, #e4e6e9 55%, #d6d9dd 100%);
  border: 1px solid #8c939b;
  box-shadow:
    inset 0 1px 0 #ffffff,
    0 1px 3px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease;
}

/* iPhone 4/5 Hardware Bezel (Desktop Preview Frame Mode) */
.ios6-iphone-bezel {
  background: linear-gradient(160deg, #27292d 0%, #111215 48%, #0a0b0d 100%);
  border: 2px solid #595e66;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.72),
    inset 0 1px 1px rgba(255, 255, 255, 0.28),
    inset 0 0 0 2px #050506;
}

.ios6-home-button {
  background: radial-gradient(circle at 50% 35%, #2a2d32 0%, #111215 68%, #070809 100%);
  border: 1px solid #3c4047;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.85),
    0 1px 0 rgba(255, 255, 255, 0.14);
}
`
