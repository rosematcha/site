// The window, the visitor's settings and the small DOM helpers every engine module shares.

// the window's size, read once per resize: innerWidth read after a style write forces a whole style and layout pass
// (the pages also render in Node at build time, where the engine never runs: nothing here may touch the window on import)
const BROWSER = typeof window !== "undefined";
export const VP = { w: BROWSER ? window.innerWidth : 0, h: BROWSER ? window.innerHeight : 0 };
if (BROWSER) {
  window.addEventListener("resize", () => {
    VP.w = window.innerWidth;
    VP.h = window.innerHeight;
  });
}
export const PHONE = () => VP.w < 600;
// phones: every height times 0.6, so no shadow leaves the gutter
export const HS = () => (PHONE() ? 0.6 : 1);
export const mq = (query: string) => window.matchMedia(query).matches;
// reduced motion, followed live: a change applies at once (the root's .rm class with it), not on the next load
const motion = { reduce: BROWSER && mq("(prefers-reduced-motion: reduce)") };
export const RM = () => motion.reduce;
if (BROWSER) {
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", e => {
    motion.reduce = e.matches;
    document.documentElement.classList.toggle("rm", e.matches);
  });
}
// Gecko alone answers to its prefix
export const GECKO = typeof CSS !== "undefined" && CSS.supports("-moz-appearance", "none");

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const dist = (dx: number, dy: number) => Math.sqrt(dx * dx + dy * dy);
export const f1 = (v: number) => v.toFixed(1);
export const f0 = (v: number) => v.toFixed(0);

export function $(s: string, r: ParentNode = document): HTMLElement | null {
  return r.querySelector<HTMLElement>(s);
}
export function $$<T extends Element = HTMLElement>(s: string, r: ParentNode = document): T[] {
  return [...r.querySelectorAll<T>(s)];
}
// a callback when the main thread is idle (Safari has no requestIdleCallback: a timeout stands in)
export function idle(f: () => void, timeout = 400) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(f, { timeout });
    return;
  }
  setTimeout(f, 1);
}
export const num = (v: string | undefined | null) => Number(v ?? 0) || 0;
export const radius = (el: Element) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
