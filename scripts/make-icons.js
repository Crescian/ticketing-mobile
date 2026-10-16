// Builds every app icon from the LGICT logo (assets/images/lgict-logo.png,
// copied from the web app's public/img/LGICT.png). Run: node scripts/make-icons.js
const { Jimp } = require('jimp');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'assets', 'images');
const WHITE = 0xffffffff;
const CREAM = 0xf5f0e8ff;
const CLEAR = 0x00000000;

async function logo() {
  const img = await Jimp.read(path.join(OUT, 'lgict-logo.png'));
  img.autocrop(); // trim the transparent margin
  return img;
}

// Logo centred on a canvas, scaled to `fraction` of the canvas width.
async function canvas(size, fraction, background, { height = size, mono = false } = {}) {
  const art = await logo();
  art.scaleToFit({ w: Math.round(size * fraction), h: Math.round(height * fraction) });
  if (mono) {
    // Android monochrome/notification icons only use the alpha channel.
    art.scan(0, 0, art.bitmap.width, art.bitmap.height, (x, y, idx) => {
      art.bitmap.data[idx] = 0;
      art.bitmap.data[idx + 1] = 0;
      art.bitmap.data[idx + 2] = 0;
    });
  }
  const out = new Jimp({ width: size, height, color: background });
  out.composite(art, Math.round((size - art.bitmap.width) / 2), Math.round((height - art.bitmap.height) / 2));
  return out;
}

(async () => {
  await (await canvas(1024, 0.8, WHITE)).write(path.join(OUT, 'icon.png'));
  // Adaptive icon: keep the art inside the ~66% safe zone.
  await (await canvas(512, 0.6, CLEAR)).write(path.join(OUT, 'android-icon-foreground.png'));
  await (await canvas(432, 0.6, CLEAR, { mono: true })).write(path.join(OUT, 'android-icon-monochrome.png'));
  await (await canvas(600, 0.95, CLEAR, { height: 300 })).write(path.join(OUT, 'splash-icon.png'));
  await (await canvas(48, 0.9, WHITE)).write(path.join(OUT, 'favicon.png'));
  console.log('icons written');
})();
