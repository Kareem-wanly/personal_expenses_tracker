/**
 * Generates every brand asset from src/lib/brand.ts:
 *   public/icons/*  — app icons, maskable icon, Apple touch icon, badge
 *   src/app/favicon.ico
 *   public/splash/* — iOS launch images for each iPhone/iPad screen
 *
 *   npm run brand
 *
 * Launch images are rendered in Chromium (Playwright) from the same markup
 * and CSS as the in-app splash, with the app's own Arabic font, so the
 * static image and the animated splash line up exactly.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";

import sharp from "sharp";

import {
  BRAND,
  SPLASH_CSS,
  STARTUP_DEVICES,
  badgeSvg,
  iconSvg,
  splashInnerHtml,
  startupImagePath,
} from "../src/lib/brand";

const ICONS = "public/icons";
const png = (svg: string, size: number) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 });

/** ICO container holding PNG images (supported by every current browser). */
function ico(images: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

async function icons() {
  await mkdir(ICONS, { recursive: true });
  await writeFile(`${ICONS}/icon.svg`, iconSvg());
  for (const size of [192, 512]) await png(iconSvg(), size).toFile(`${ICONS}/icon-${size}.png`);
  // Maskable: full bleed, wallet inside the 80% safe circle.
  await png(iconSvg({ fullBleed: true, scale: 0.78 }), 512).toFile(`${ICONS}/maskable-512.png`);
  // iOS rounds the corners itself; transparent corners would turn black.
  await png(iconSvg({ fullBleed: true }), 180).flatten({ background: BRAND.solid }).toFile(`${ICONS}/apple-touch-icon.png`);
  await png(badgeSvg(), 96).toFile(`${ICONS}/badge-96.png`);
  const favicon = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(iconSvg(), size).toBuffer() })));
  await writeFile("src/app/favicon.ico", ico(favicon));
  console.log("✓ icons");
}

async function launchImages() {
  // Minimal shape of what we use, so typechecking doesn't need Playwright.
  type Page = {
    setContent(html: string): Promise<void>;
    evaluate(fn: () => unknown): Promise<unknown>;
    screenshot(o: { type: "png" }): Promise<Buffer>;
    close(): Promise<void>;
  };
  type Browser = {
    newPage(o: { viewport: { width: number; height: number }; deviceScaleFactor: number }): Promise<Page>;
    close(): Promise<void>;
  };
  let chromium: { launch(): Promise<Browser> };
  try {
    // require (not import) so NODE_PATH works with a globally installed copy.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ chromium } = require("playwright"));
  } catch {
    console.warn("⚠ Playwright not found — skipping launch images (npm i -D playwright).");
    return;
  }
  const font = await readFile(
    "node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2",
  );
  const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:SplashFont;font-weight:700;src:url(data:font/woff2;base64,${font.toString("base64")}) format("woff2")}
html,body{margin:0;height:100%}:root{--splash-font:SplashFont}${SPLASH_CSS}
</style></head><body><div class="splash">${splashInnerHtml()}</div></body></html>`;

  await mkdir("public/splash", { recursive: true });
  const browser = await chromium.launch();
  for (const d of STARTUP_DEVICES) {
    const page = await browser.newPage({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: d.r });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    const shot = await page.screenshot({ type: "png" });
    // JPEG: a full-colour PNG of a gradient is ~1 MB, and a reduced palette
    // bands it. 4:4:4 chroma keeps the white edges crisp.
    await sharp(shot)
      .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(`public${startupImagePath(d)}`);
    await page.close();
  }
  await browser.close();
  console.log(`✓ ${STARTUP_DEVICES.length} launch images`);
}

async function main() {
  await icons();
  await launchImages();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
