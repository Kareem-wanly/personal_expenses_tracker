// Generates PWA icons from public/icons/icon.svg. Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile("public/icons/icon.svg");
const out = "public/icons";

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(`${out}/icon-${size}.png`);
}
// Maskable: full-bleed background with the glyph inside the 80% safe zone.
const inner = await sharp(svg).resize(400, 400).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#059669" } })
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile(`${out}/maskable-512.png`);
await sharp(svg).resize(180, 180).flatten({ background: "#059669" }).png().toFile(`${out}/apple-touch-icon.png`);
// Android status-bar notification badge: white glyph on transparent.
const badge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
<rect x="14" y="24" width="68" height="50" rx="10"/><path d="M14 39h68"/><path d="M57 58h11"/></g>
<circle cx="30" cy="58" r="5" fill="#fff"/></svg>`;
await sharp(Buffer.from(badge)).png().toFile(`${out}/badge-96.png`);
console.log("icons generated");
