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
console.log("icons generated");
