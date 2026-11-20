// The scaled copies scripts/scale-images.mjs writes next to each original, and the srcsets that name them.
export const below = (widths: number[], w0: number) => widths.filter(w => w < w0 * 0.9);
export const scaled = (src: string, w: number, tag = "") =>
  src.replace(/\.webp$/, `-${tag}${String(w)}.webp`);
const entry = (src: string, w: number) => `${src} ${String(w)}w`;
// a picture's candidates: its own small file (if any), the copies between it and the original, the original
export function srcset(
  src: string,
  w0: number,
  widths: number[],
  small?: { src: string; w: number }
) {
  const copies = below(widths, w0).filter(w => !small || w > small.w);
  return [
    ...(small ? [entry(small.src, small.w)] : []),
    ...copies.map(w => entry(scaled(src, w), w)),
    entry(src, w0),
  ].join(", ");
}
export const STEPS = [480, 640, 800, 960];
// a set's prints also take 1280 (a print fills a phone's column at DPR 3, about 1070 px)
export const PRINT = [640, 800, 960, 1280];
// the Photos page's covers: lighter copies (quality 75) at the widths a cover is drawn at DPR 1 to 3
const COVER = [320, 480, 640, 960, 1280];
export const coverSet = (src: string, w0: number) =>
  below(COVER, w0)
    .map(w => entry(scaled(src, w, "cover-"), w))
    .join(", ");
// a picture cropped by object-fit: cover into a box of aspect `box` is drawn wider than its box when it is the wider of the two
export function sizesOf(list: [string, string][], last: string, ar: number, box: number) {
  const f = Math.max(1, ar / box);
  const times = (len: string) => (f > 1.001 ? `calc(${len} * ${f.toFixed(3)})` : len);
  return [...list.map(([m, len]) => `${m} ${times(len)}`), times(last)].join(", ");
}
