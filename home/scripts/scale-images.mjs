// Writes the scaled copies the pages' srcsets name, next to each original in public/img (src/data/images.ts names them):
// prints at WebP quality 92 (<name>-<w>.webp) and the Photos page covers at quality 75 (<name>-cover-<w>.webp).
// A copy is made when it is missing or older than its source (a replaced photograph). Run after adding or replacing photographs:
// node scripts/scale-images.mjs
import { existsSync, readFileSync, statSync } from 'node:fs';
import sharp from 'sharp';

const pub = new URL('../public', import.meta.url).pathname;
const events = JSON.parse(readFileSync(new URL('../src/data/photos.json', import.meta.url), 'utf8'));
const below = (list, w0) => list.filter(w => w < w0 * 0.9);
const name = (src, w, tag = '') => src.replace(/\.webp$/, `-${tag}${w}.webp`);

const jobs = [];
for (const event of events) {
  for (const photo of event.photos) {
    for (const w of below([640, 800, 960, 1280], photo.width).filter(x => x > photo.thumbnailWidth)) {
      jobs.push([photo.src, w, 92, name(photo.src, w)]);
    }
  }
  const cover = event.photos.find(p => p.id === event.coverId) ?? event.photos[0];
  for (const w of below([320, 480, 640, 960, 1280], cover.width)) {
    jobs.push([cover.src, w, 75, name(cover.src, w, 'cover-')]);
  }
}
for (const [src, width] of [['/img/portraits/me-camera-halation.webp', 1100], ['/img/portraits/me-soykirb-halation.webp', 666]]) {
  for (const w of below([480, 640, 800, 960], width)) {
    jobs.push([src, w, 92, name(src, w)]);
  }
}

let made = 0;
for (const [src, w, quality, out] of jobs) {
  if (existsSync(pub + out) && statSync(pub + out).mtimeMs >= statSync(pub + src).mtimeMs) {
    continue;
  }
  // one image at a time keeps memory flat
  await sharp(pub + src).resize({ width: w, kernel: 'lanczos3' }).webp({ quality, effort: 6 }).toFile(pub + out);
  made += 1;
}
console.log(`${String(jobs.length)} copies planned, ${String(made)} written`);
