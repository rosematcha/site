// Objects under a lamp: a 1 px highlight toward it and a 1 px dark edge away from it (none on photographs, which glow faintly
// past the print instead), and a wash on the near side laid on with overlay inside the face's own stack. Screens and buttons
// take the disc crisper than the ground; photographs scatter it wider and weaker.
import type { Obj, Wash } from "../objects";
import { mk } from "../scope";

import { E, nearestOn, type Rect } from "./math";
import { cxOf, cyOf, lit, P, type Lamp } from "./types";

const q = (v: number, s: number) => Math.round(v / s) * s;
const n0 = (v: number) => String(q(v, 2));
const h2 = (v: number) =>
  Math.round(Math.max(0, Math.min(255, v)))
    .toString(16)
    .padStart(2, "0");
// a computed colour with its alpha, as #rrggbbaa
const hex = (c: number[], a: number) => `#${c.map(h2).join("")}${h2(a * 255)}`;
const BLACK = [0, 0, 0];
// the wash's place, reach and colour; its gradient is kit.css's (.face > .wash, and .photo for a photograph)
function washVars(W: Wash, R: number, lx: number, ly: number, c: number[]) {
  const key = [c.join(" "), R.toFixed(0), n0(lx), n0(ly)];
  const k = key.join("|");
  if (W.bg === k) {
    return;
  }
  W.bg = k;
  const [wc = "", wr = "", wx = "", wy = ""] = key;
  W.el.style.setProperty("--wc", wc);
  W.el.style.setProperty("--wr", `${wr}px`);
  W.el.style.setProperty("--wx", `${wx}px`);
  W.el.style.setProperty("--wy", `${wy}px`);
}
function edgeLight(o: Obj, e: number, ux: number, uy: number, c: number[]) {
  if (o.photo) {
    return "";
  }
  const a = q(Math.min(0.25, 0.3 * e), 0.05);
  const d = q(0.2 * e, 0.05);
  if (a <= 0) {
    return "";
  }
  return `inset ${(-ux).toFixed(1)}px ${(-uy).toFixed(1)}px 0 ${hex(c, a)}, inset ${ux.toFixed(1)}px ${uy.toFixed(1)}px 0 ${hex(BLACK, d)}`;
}
// objects adopted after boot too
function kind(o: Obj) {
  if (o.label === null) {
    o.label = Boolean(o.face.querySelector(".label, .where"));
    o.photo = Boolean(o.el.closest(".portrait, .ph"));
  }
}
interface Lighting {
  hc: boolean;
  navShown: boolean;
  rectOf: (o: Obj) => Rect;
}
function dim(o: Obj, i: number) {
  const W = o.washes[i];
  if (W && W.o !== "0") {
    W.o = "0";
    W.el.style.opacity = "0";
  }
}
function wash(o: Obj, i: number) {
  const old = o.washes[i];
  if (old) {
    return old;
  }
  const el = mk("span", o.photo ? "wash photo" : "wash");
  el.style.mixBlendMode = "overlay";
  o.face.prepend(el);
  const W = { el, o: "", bg: "" };
  o.washes[i] = W;
  return W;
}
// one lamp on one object: the rim's parts it adds, and its wash's opacity (or null when it doesn't reach)
function lampOn(o: Obj, L: Lamp, i: number, r: Rect, k: Lighting): [string, number] | null {
  const lpx = cxOf(L);
  const lpy = cyOf(L);
  const [nx, ny] = nearestOn(r, lpx, lpy);
  const on = lit(L) && !k.hc && (!o.fixed || k.navShown);
  const e = on ? L.g * P.s * E(Math.hypot(nx - lpx, ny - lpy), L.R) : 0;
  if (e < 0.02) {
    dim(o, i);
    return null;
  }
  const cx = (r[0] + r[2]) / 2;
  const cy = (r[1] + r[3]) / 2;
  const du = Math.max(1, Math.hypot(lpx - cx, lpy - cy));
  const c = L.rgb.map(v => Math.round(q(v, 255 / 12)));
  const parts = [edgeLight(o, e, (lpx - cx) / du, (lpy - cy) / du, c)];
  if (o.photo) {
    parts.push(`0 0 14px 1px ${hex(c, q(Math.min(0.14, 0.2 * e), 0.02))}`); // the glow past the print
  }
  washVars(wash(o, i), L.R, lpx - r[0], lpy - r[1], c);
  const cap = o.label ? (P.labelCap[L.slot] ?? P.cap) : P.cap;
  return [parts.filter(Boolean).join(", "), Math.min(cap, 0.9 * L.g * P.s) * (o.photo ? 0.8 : 1)];
}
export function objLight(o: Obj, lamps: Lamp[], k: Lighting) {
  if (o.nolamp) {
    o.lampRim = "";
    return;
  }
  kind(o);
  const r = k.rectOf(o);
  const rims: string[] = [];
  lamps.forEach((L, i) => {
    const got = lampOn(o, L, i, r, k);
    if (!got) {
      return;
    }
    if (got[0]) {
      rims.push(got[0]);
    }
    const W = o.washes[i];
    const op = got[1].toFixed(2);
    if (W && W.o !== op) {
      W.o = op;
      W.el.style.opacity = op;
    }
  });
  o.lampRim = rims.join(", ");
}
