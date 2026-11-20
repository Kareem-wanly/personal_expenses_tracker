/**
 * The app's brand mark and launch screen, defined once.
 *
 * Used by the root layout (animated in-app splash) and by
 * scripts/generate-brand.ts, which renders the icons and the iOS startup
 * images from this exact markup and CSS — so the static image iOS shows
 * while launching and the first frame of the in-app splash are identical.
 */

export const BRAND = {
  /** Gradient stops of the icon tile and the splash background. */
  light: "#2dd48f",
  mid: "#0fa56c",
  deep: "#067a50",
  /** Solid fallback (Android splash, maskable padding). */
  solid: "#0c9a64",
} as const;

const DEFS = `<defs>
<linearGradient id="mx-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND.light}"/><stop offset=".55" stop-color="${BRAND.mid}"/><stop offset="1" stop-color="${BRAND.deep}"/></linearGradient>
<radialGradient id="mx-hl" cx=".25" cy=".1" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="mx-sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#023d27" flood-opacity=".35"/></filter>
</defs>`;

/** The wallet: a card tucked behind, the wallet, and its clasp. 1024 grid. */
const WALLET = `<g filter="url(#mx-sh)">
<g class="splash-card"><rect x="262" y="250" width="520" height="330" rx="64" fill="#fff" opacity=".45" transform="rotate(-9 522 415)"/></g>
<rect x="196" y="352" width="632" height="440" rx="88" fill="#fff"/>
<rect x="610" y="498" width="218" height="148" rx="74" fill="${BRAND.solid}"/>
<circle cx="684" cy="572" r="30" fill="#fff"/>
</g>`;

/**
 * App icon. `fullBleed` fills the square (iOS and Android round it
 * themselves); `scale` shrinks the wallet into a safe zone (maskable).
 */
export function iconSvg({ fullBleed = false, scale = 1 } = {}) {
  const rx = fullBleed ? 0 : 230;
  const t = scale === 1 ? "" : ` transform="translate(${512 * (1 - scale)} ${512 * (1 - scale)}) scale(${scale})"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${DEFS}
<rect width="1024" height="1024" rx="${rx}" fill="url(#mx-bg)"/><rect width="1024" height="1024" rx="${rx}" fill="url(#mx-hl)"/>
<g${t}>${WALLET}</g></svg>`;
}

/** Just the wallet, cropped to its bounds, for the splash screen. */
export function walletSvg(className = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="180 196 664 640" class="${className}" aria-hidden="true">${DEFS}${WALLET}</svg>`;
}

/** Monochrome glyph for Android's notification badge (white on transparent). */
export function badgeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="180 196 664 640">
<rect x="262" y="250" width="520" height="330" rx="64" fill="#fff" opacity=".55" transform="rotate(-9 522 415)"/>
<path fill="#fff" fill-rule="evenodd" d="M284 352h456a88 88 0 0 1 88 88v264a88 88 0 0 1-88 88H284a88 88 0 0 1-88-88V440a88 88 0 0 1 88-88Zm400 190a30 30 0 1 0 0 60 30 30 0 1 0 0-60Z"/>
</svg>`;
}

/* --------------------------------- Splash -------------------------------- */

export const SPLASH_WORDMARK = "مصروفي";

/** Markup inside the splash container. */
export function splashInnerHtml() {
  return `<div class="splash-group">${walletSvg("splash-mark")}<div class="splash-word">${SPLASH_WORDMARK}</div></div>`;
}

/**
 * Splash styles. `--splash-font` is set by the host: the app's Plex
 * variable in the layout, an @font-face of the same file in the generator.
 */
export const SPLASH_CSS = `
.splash{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(120% 70% at 20% 0%,rgb(255 255 255/.28),transparent 60%),linear-gradient(160deg,${BRAND.light} 0%,${BRAND.mid} 52%,${BRAND.deep} 100%);
  color:#fff;-webkit-user-select:none;user-select:none;pointer-events:none}
.splash-group{display:flex;flex-direction:column;align-items:center;gap:min(4.5vw,2.6vh,28px);margin-bottom:9vh}
.splash-mark{width:min(38vw,24vh,260px);height:auto;overflow:visible}
.splash-word{font-family:var(--splash-font);font-weight:700;font-size:min(9.5vw,6vh,60px);line-height:1.2;letter-spacing:0}
`;

/**
 * In-app animation, only for the installed app (that's where iOS shows the
 * static launch image it continues from). Shown once per session, and
 * quick: done in ~0.8 s. The card pops out of the wallet, then the logo
 * opens out into the app while the screen fades away.
 */
export const SPLASH_ANIMATION_CSS = `
.splash{display:none}
.splash-card{transform-box:fill-box;transform-origin:center}
@media (display-mode: standalone){
  html:not([data-splash-seen]) .splash{display:flex;animation:splash-out .36s cubic-bezier(.4,0,.2,1) .46s both;view-transition-name:splash}
  html:not([data-splash-seen]) .splash-mark{animation:splash-mark .82s cubic-bezier(.32,.72,0,1) both}
  html:not([data-splash-seen]) .splash-card{animation:splash-card .46s cubic-bezier(.34,1.56,.64,1) both}
  html:not([data-splash-seen]) .splash-word{animation:splash-word .82s ease both}
}
/* Page view transitions (e.g. the first content reveal) paint above the
   page in the top layer; keep the splash above them while it plays. */
::view-transition-group(splash){z-index:2147483000;animation:none}
::view-transition-old(splash){display:none}
::view-transition-new(splash){animation:none}
@keyframes splash-card{0%{transform:translateY(0)}55%{transform:translateY(-78px)}100%{transform:translateY(-50px)}}
@keyframes splash-mark{0%{transform:scale(1)}28%{transform:scale(1.08)}100%{transform:scale(1.8);opacity:0}}
@keyframes splash-word{0%,30%{opacity:1;transform:none}100%{opacity:0;transform:translateY(10px) scale(.96)}}
@keyframes splash-out{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion: reduce){
  html:not([data-splash-seen]) .splash-mark,html:not([data-splash-seen]) .splash-card,html:not([data-splash-seen]) .splash-word{animation:none}
  html:not([data-splash-seen]) .splash{animation:splash-out .2s ease .25s both}
}
`;

/**
 * Runs before first paint: skip the splash after the first launch this
 * session; once it has played, mark it done so it leaves later transitions.
 */
export const SPLASH_SCRIPT = `try{var d=document.documentElement;if(sessionStorage.getItem("splash-seen"))d.setAttribute("data-splash-seen","");else{sessionStorage.setItem("splash-seen","1");document.addEventListener("animationend",function f(e){if(e.animationName==="splash-out"){d.setAttribute("data-splash-seen","");document.removeEventListener("animationend",f)}})}}catch(e){}`;

/** iOS launch images (portrait), CSS size × pixel ratio. */
export const STARTUP_DEVICES = [
  // iPhones
  { w: 440, h: 956, r: 3 }, // 16 Pro Max, 17 Pro Max
  { w: 402, h: 874, r: 3 }, // 16 Pro, 17, 17 Pro
  { w: 420, h: 912, r: 3 }, // Air
  { w: 430, h: 932, r: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { w: 393, h: 852, r: 3 }, // 14 Pro, 15, 15 Pro, 16
  { w: 428, h: 926, r: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 390, h: 844, r: 3 }, // 12, 13, 14
  { w: 375, h: 812, r: 3 }, // X, XS, 11 Pro, 12/13 mini
  { w: 414, h: 896, r: 3 }, // XS Max, 11 Pro Max
  { w: 414, h: 896, r: 2 }, // XR, 11
  { w: 414, h: 736, r: 3 }, // 6+/7+/8 Plus
  { w: 375, h: 667, r: 2 }, // 6/7/8, SE 2/3
  { w: 320, h: 568, r: 2 }, // SE 1
  // iPads
  { w: 1032, h: 1376, r: 2 }, // Pro 13" (M4)
  { w: 1024, h: 1366, r: 2 }, // Pro 12.9"
  { w: 834, h: 1210, r: 2 }, // Pro 11" (M4)
  { w: 834, h: 1194, r: 2 }, // Pro 11"
  { w: 820, h: 1180, r: 2 }, // Air 10.9", 10th gen
  { w: 834, h: 1112, r: 2 }, // Air 10.5"
  { w: 810, h: 1080, r: 2 }, // 10.2"
  { w: 768, h: 1024, r: 2 }, // 9.7", mini 5
  { w: 744, h: 1133, r: 2 }, // mini 6
] as const;

export const startupImagePath = (d: { w: number; h: number; r: number }) =>
  `/splash/launch-${d.w * d.r}x${d.h * d.r}.jpg`;

export const startupImageMedia = (d: { w: number; h: number; r: number }) =>
  `(device-width: ${d.w}px) and (device-height: ${d.h}px) and (-webkit-device-pixel-ratio: ${d.r}) and (orientation: portrait)`;
