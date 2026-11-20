// The frame loop: runs while anything moves, then sleeps. Within one frame the page's scroll and each shelf's scrollLeft are
// read once (they were read about 95 times a frame, between style writes); outside a frame every read is live.
export interface Hook {
  update: (dt: number) => boolean;
}
export interface Shelf {
  ul: HTMLElement;
  sl0: number; // scrollLeft at the last measure
  give: number; // the rubber band past either end, px
  f: number;
  sl: number;
}
export const extra = new Set<Hook>();
let raf = 0;
let last = 0;
let inFrame = 0;
let frames = 0;
let fsx = 0;
let fsy = 0;
let frameFn: (dt: number) => boolean = () => false;

export const SX = () => (inFrame ? fsx : window.scrollX);
export const SY = () => (inFrame ? fsy : window.scrollY);
export const inside = () => inFrame > 0;
export function sl(s: Shelf) {
  if (!inFrame) {
    return s.ul.scrollLeft;
  }
  if (s.f !== inFrame) {
    s.f = inFrame;
    s.sl = s.ul.scrollLeft;
  }
  return s.sl;
}
function tick(t: number) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  inFrame = ++frames;
  fsx = window.scrollX;
  fsy = window.scrollY;
  let more = false;
  try {
    more = frameFn(dt);
  } finally {
    inFrame = 0;
  }
  for (const x of extra) {
    more = x.update(dt) || more;
  }
  raf = more ? requestAnimationFrame(tick) : 0;
}
export function wake() {
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
}
export function setFrame(f: (dt: number) => boolean) {
  frameFn = f;
}
export function stopFrames() {
  cancelAnimationFrame(raf);
  raf = 0;
  frameFn = () => false;
  extra.clear();
}
