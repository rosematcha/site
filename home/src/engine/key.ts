// The key: v22's pool (an ellipse RX by RY about x, y in the viewport); the source stands above it, so shadows fall away from
// the top. The visitor's pointer, tilt or the page's rest aim it; it eases there on a spring.
import { clamp, f0, f1, PHONE, RM, VP } from "./env";
import { wake } from "./frame";
import { spring, stepSpring } from "./spring";

export const key = { x: 0, y: 0, RX: 1, RY: 1, lx: 0, ly: 0, z: 440, gain: 1 };
const poolT = (vx: number, vy: number) =>
  Math.min(1, Math.hypot((vx - key.x) / key.RX, (vy - key.y) / key.RY));
// the key's shadows are strongest where its pool is brightest
export const keyPool = (vx: number, vy: number) => clamp(1.15 - poolT(vx, vy), 0.15, 1);
// shadow of a point at height h from a light at (lx, ly, z), viewport px: offset and scale, the offset capped at cap * h
export function project(vx: number, vy: number, h: number, cap = 2.2) {
  const k = h / Math.max(8, key.z - h);
  let dx = (vx - key.lx) * k;
  let dy = (vy - key.ly) * k;
  const m = Math.hypot(dx, dy);
  const c = cap * h;
  if (m > c) {
    dx *= c / m;
    dy *= c / m;
  }
  return { dx, dy, sc: key.z / Math.max(8, key.z - h) };
}

// the gain maps the input (0..1) to the pool's centre; a full sweep moves 20 to 40% of the first screen
export interface Gain {
  phone: [number, number];
  wide: [number, number];
}
const KS = { x: spring(0, 2.8, 0.8, 0.1), y: spring(0, 2.8, 0.8, 0.1) };
const target = { x: 0.5, y: 0.3 };
let keyInit = false;
let keyT = "";
let el: HTMLElement | null = null;
let G: Gain = { phone: [1.25, 0.34], wide: [0.74, 0.26] };
function keyMap(x: number, y: number): [number, number] {
  if (VP.w < 700) {
    return [0.5 + (x - 0.4) * G.phone[0], 0.26 + (y - 0.28) * G.phone[1]];
  }
  return [0.5 + (x - 0.5) * G.wide[0], 0.3 + (y - 0.5) * G.wide[1]];
}
export function initKey(box: HTMLElement | null, gain: Partial<Gain>) {
  el = box;
  G = { phone: [1.25, 0.34], wide: [0.74, 0.26], ...gain };
  keyInit = false;
  keyT = "";
}
export function stepKey(dt: number) {
  const a = stepSpring(KS.x, dt);
  const b = stepSpring(KS.y, dt);
  return a || b;
}
export function paintKey() {
  key.x = KS.x.x;
  key.y = KS.y.x;
  key.lx = key.x;
  key.ly = key.y - (PHONE() ? 0.42 : 0.5) * VP.h;
  const t = `translate3d(${f1(key.x - 1.5 * VP.w)}px, ${f1(key.y - 1.5 * VP.h)}px, 0)`;
  if (el && t !== keyT) {
    keyT = t;
    el.style.transform = t;
  }
}
export function aimKey(x = target.x, y = target.y) {
  target.x = x;
  target.y = y;
  const [kx, ky] = keyMap(x, y);
  KS.x.t = kx * VP.w;
  KS.y.t = ky * VP.h;
  if (!keyInit || RM()) {
    KS.x.x = KS.x.t;
    KS.y.x = KS.y.t;
    KS.x.v = 0;
    KS.y.v = 0;
    keyInit = true;
  }
  wake();
}
export function layoutKey() {
  VP.w = window.innerWidth;
  VP.h = window.innerHeight;
  key.RX = (PHONE() ? 0.95 : 0.6) * VP.w;
  key.RY = (PHONE() ? 0.42 : 0.55) * VP.h;
  if (el) {
    el.style.width = `${f0(3 * VP.w)}px`;
    el.style.height = `${f0(3 * VP.h)}px`;
    el.style.setProperty("--krx", `${f0(key.RX)}px`);
    el.style.setProperty("--kry", `${f0(key.RY)}px`);
  }
  aimKey();
}
