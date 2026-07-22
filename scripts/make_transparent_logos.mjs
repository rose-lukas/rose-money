// One-off: make RoseHome logos sit on a transparent background (uses sharp).
//
// - Light logo is the source of truth (good proportions).
// - Background removed via luminance -> alpha (keeps smooth anti-aliased edges).
// - Light variant: black artwork on transparent.
// - Dark variant: derived from the SAME source recolored white (fixes the
//   stretched dark logo by reusing the light logo's geometry).

import sharp from "sharp";

const SRC = "public/logo/logo-light-new.png";

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;
const n = width * height;

const light = Buffer.alloc(n * 4); // black on transparent
const dark = Buffer.alloc(n * 4); // white on transparent

for (let i = 0; i < n; i++) {
  const r = data[i * 4];
  const g = data[i * 4 + 1];
  const b = data[i * 4 + 2];
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  let a = Math.round(255 - lum); // dark artwork -> opaque, light bg -> transparent
  if (a < 25) a = 0; // clean off faint near-white background

  light[i * 4] = 0;
  light[i * 4 + 1] = 0;
  light[i * 4 + 2] = 0;
  light[i * 4 + 3] = a;

  dark[i * 4] = 255;
  dark[i * 4 + 1] = 255;
  dark[i * 4 + 2] = 255;
  dark[i * 4 + 3] = a;
}

const raw = { raw: { width, height, channels: 4 } };

await sharp(light, raw).png().toFile("public/logo/logo-light-new.png");
await sharp(dark, raw).png().toFile("public/logo/logo-dark-new.png");
// Browser tab favicon: black-on-transparent works on light chrome
await sharp(light, raw).png().toFile("public/favicon.png");

console.log(`done: ${width}x${height}`);
