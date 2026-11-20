// Objects: `.obj[data-h] > .face > .clip`; one key cast each (plain dark alpha, pre-blurred mask, moved by transform), a rim
// toward the key, a lift-and-lean spring on tiles. Raised type: `[data-ts]` (text-shadow from the key).
import { f1, GECKO, HS, num, radius } from "./env";
import { inside, sl, SX, SY, type Shelf } from "./frame";
import { key, keyPool, project } from "./key";
import { made, mk } from "./scope";
import { spring, type Spring } from "./spring";

export interface Wash {
  el: HTMLElement;
  o: string;
  bg: string;
}
interface Placed {
  el: HTMLElement;
  fixed: boolean;
  shelf: Shelf | null;
  px: number;
  py: number;
  w: number;
  hh: number;
  vx: number;
  vy: number;
}
export interface Obj extends Placed {
  face: HTMLElement;
  cast: HTMLElement;
  h: number;
  blur: number;
  lift: Spring;
  rx: Spring;
  ry: Spring;
  bd: boolean;
  nolamp: boolean;
  vis: boolean;
  mem: { t: string; o: string; bw: string; rc: string; rim: string; f: string };
  br: number | null;
  mk: string;
  mkDue: boolean;
  cv: HTMLCanvasElement | null;
  tile: HTMLElement | null;
  washes: (Wash | undefined)[];
  lampRim: string;
  label: boolean | null;
  photo: boolean;
  rad: number | null;
}
export interface TypeEl extends Placed {
  h: number;
  mem: string;
}
export type ShelfOf = (el: Element) => Shelf | null;

// an object in a <dialog> (the photo viewer) is measured per frame like the nav button's, since its dialog moves it;
// data-lamp="off" on an object, or any object in a dialog: the lamps never touch it, only the key casts it.
// bake (Firefox, the photo pages): a photograph's key rim is drawn as borders (kit.css .face.bd)
export function mkObj(el: HTMLElement, shelfOf: ShelfOf, bake: boolean): Obj {
  const face = el.querySelector<HTMLElement>(":scope > .face") ?? el;
  const cast = mk("span", "cast");
  el.prepend(cast);
  const h = num(el.dataset.h);
  const bd = bake && Boolean(face.querySelector(".ca"));
  if (bd) {
    face.classList.add("bd");
  }
  const lean = () => spring(0, 5, 0.55);
  return {
    el,
    face,
    cast,
    h,
    blur: 3 + 0.9 * h,
    lift: lean(),
    rx: lean(),
    ry: lean(),
    fixed: Boolean(el.closest(".bars-btn, dialog")),
    bd,
    nolamp: el.dataset.lamp === "off" || Boolean(el.closest("dialog")),
    shelf: shelfOf(el),
    px: 0,
    py: 0,
    w: 0,
    hh: 0,
    vx: 0,
    vy: 0,
    vis: false,
    mem: { t: "", o: "", bw: "", rc: "", rim: "", f: "" },
    br: null,
    mk: "",
    mkDue: false,
    cv: null,
    tile: null,
    washes: [],
    lampRim: "",
    label: null,
    photo: false,
    rad: null,
  };
}
export const mkType = (el: HTMLElement, shelfOf: ShelfOf): TypeEl => ({
  el,
  h: num(el.dataset.ts),
  fixed: false,
  shelf: shelfOf(el),
  px: 0,
  py: 0,
  w: 0,
  hh: 0,
  vx: 0,
  vy: 0,
  mem: "",
});

// a shelf's scroll and give since the last measure, applied per frame without layout reads
export const shelfDx = (s: Shelf | null) => (s ? sl(s) - s.sl0 - s.give : 0);
export function measure(shelves: Shelf[], items: Placed[]) {
  for (const s of shelves) {
    s.sl0 = s.ul.scrollLeft;
  }
  for (const o of items) {
    const r = o.el.getBoundingClientRect();
    o.w = r.width;
    o.hh = r.height;
    // without the give; view() adds it back
    o.px = r.left + r.width / 2 + (o.fixed ? 0 : window.scrollX) - (o.shelf ? o.shelf.give : 0);
    o.py = r.top + r.height / 2 + (o.fixed ? 0 : window.scrollY);
  }
}
// a fixed object (the nav button, a dialog's) is measured at the top of each frame, before the frame writes any style
export function fixedRect(o: Placed) {
  const r = o.el.getBoundingClientRect();
  o.w = r.width;
  o.hh = r.height;
  o.vx = r.left + r.width / 2;
  o.vy = r.top + r.height / 2;
}
export function view(o: Placed) {
  if (o.fixed) {
    if (!inside()) {
      fixedRect(o);
    }
    return;
  }
  o.vx = o.px - SX() - shelfDx(o.shelf);
  o.vy = o.py - SY();
}
export const near = (o: Placed, W: number, H: number, m = 140) =>
  o.vx + o.w / 2 > -m &&
  o.vx - o.w / 2 < W + m &&
  o.vy + o.hh / 2 > -m &&
  o.vy - o.hh / 2 < H + m &&
  o.w > 0;

// ---- pre-blurred key casts, re-made when a face changes size ----
// at layout only the masks of objects within 200 px of the window are made; the rest in idle slices (two a slice) and, if one is
// still missing when its object comes near, on that frame
const blurMask = (w: number, h: number, r: number, s: number, p: number) => {
  const W = String(w + 2 * p);
  const H = String(h + 2 * p);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><filter id='b' filterUnits='userSpaceOnUse' x='0' y='0' width='${W}' height='${H}'><feGaussianBlur stdDeviation='${String(s)}'/></filter><rect x='${String(p)}' y='${String(p)}' width='${String(w)}' height='${String(h)}' rx='${String(r)}' ry='${String(r)}' filter='url(#b)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
// Firefox: a masked layer that moves is drawn again with its mask each frame, so there a cast is the same blurred rounded box
// drawn once into a canvas, moved in whole px with its opacity in steps of 0.02
let castFill = "";
function geckoCast(o: Obj, r: number, s: number, p: number) {
  castFill ||= getComputedStyle(o.cast).backgroundColor; // the cast's colour (kit.css), read before it is drawn instead
  o.cv ??= made(o.cast.appendChild(document.createElement("canvas")));
  const c = o.cv;
  const w = Number(o.w.toFixed(1));
  const h = Number(o.hh.toFixed(1));
  c.width = Math.ceil(w + 2 * p);
  c.height = Math.ceil(h + 2 * p);
  const x = c.getContext("2d");
  if (x) {
    x.filter = `blur(${String(s)}px)`;
    x.fillStyle = castFill;
    x.beginPath();
    x.roundRect(p, p, w, h, Number(r.toFixed(1)));
    x.fill();
  }
  Object.assign(o.cast.style, { inset: `${String(-p)}px`, borderRadius: "0", background: "none" });
}
export function preblur(o: Obj) {
  o.mkDue = false;
  if (!o.w) {
    return;
  }
  o.br ??= radius(o.face);
  const r = Math.min(o.br, o.w / 2, o.hh / 2);
  const s = Number((o.blur * HS()).toFixed(1));
  const p = Math.ceil(3 * s);
  const k = [o.w.toFixed(0), o.hh.toFixed(0), r.toFixed(0), String(s)].join();
  if (o.mk === k) {
    return;
  }
  o.mk = k;
  if (GECKO) {
    geckoCast(o, r, s, p);
    return;
  }
  const m = blurMask(Number(f1(o.w)), Number(f1(o.hh)), Number(f1(r)), s, p);
  Object.assign(o.cast.style, {
    inset: `${String(-p)}px`,
    borderRadius: "0",
    maskImage: m,
    webkitMaskImage: m,
  });
}

// ---- painting ----
const q2 = (v: number) => (Math.round(v * 2) / 2).toFixed(1);
const px1 = (v: number) => (GECKO ? Math.round(v).toFixed(0) : v.toFixed(1));
const op = (v: number) => (GECKO ? Math.round(v * 50) / 50 : v).toFixed(2);
function paintCast(o: Obj, h: number) {
  const kp = project(o.vx, o.vy, h);
  const t0 = `translate3d(${px1(kp.dx)}px, ${px1(kp.dy)}px, 0) scale(${(1 + (kp.sc - 1) * 0.6).toFixed(3)})`;
  if (o.mem.t !== t0) {
    o.mem.t = t0;
    o.cast.style.transform = t0;
  }
  const o0 = op(0.58 * key.gain * keyPool(o.vx, o.vy) * (1 - Math.min(o.lift.x, 30) / 90));
  if (o.mem.o !== o0) {
    o.mem.o = o0;
    o.cast.style.opacity = o0;
  }
}
// the key's rim as the same 1 px edges drawn as borders (kit.css .face.bd)
function paintBorders(o: Obj, rx: string, ry: string, rc: string) {
  const bw = [ry, String(-Number(rx)), String(-Number(ry)), rx]
    .map(v => `${String(Math.max(0, Number(v)))}px`)
    .join(" ");
  if (o.mem.bw !== bw) {
    o.mem.bw = bw;
    o.face.style.setProperty("--bw", bw);
  }
  if (o.mem.rc !== rc) {
    o.mem.rc = rc;
    o.face.style.setProperty("--rc", rc);
  }
}
function paintRim(o: Obj) {
  const d0 = Math.max(1, Math.hypot(o.vx - key.lx, o.vy - key.ly));
  const rx = q2(-(o.vx - key.lx) / d0);
  const ry = q2(-(o.vy - key.ly) / d0);
  const rc = "var(--rim-k)";
  const lr = o.lampRim;
  let rim: string;
  if (o.bd) {
    rim = lr || "none";
    paintBorders(o, rx, ry, rc);
  } else {
    rim = `${lr ? `${lr}, ` : ""}inset ${rx}px ${ry}px 0 ${rc}`;
  }
  if (o.mem.rim !== rim) {
    o.mem.rim = rim;
    o.face.style.setProperty("--rim", rim);
  }
}
function paintLean(o: Obj, rm: boolean) {
  if (!(o.lift.x || o.rx.x || o.ry.x || o.mem.f)) {
    return;
  }
  const lift = `translate3d(0, ${(-0.3 * o.lift.x).toFixed(2)}px, 0) perspective(900px)`;
  const lean = `rotateX(${o.rx.x.toFixed(2)}deg) rotateY(${o.ry.x.toFixed(2)}deg) scale(${(1 + o.lift.x * 0.0012).toFixed(4)})`;
  const f = rm ? "" : `${lift} ${lean}`;
  if (o.mem.f !== f) {
    o.mem.f = f;
    o.face.style.transform = f;
  }
}
export function paintObj(o: Obj, rm: boolean) {
  paintCast(o, (o.h + o.lift.x) * HS());
  paintRim(o);
  paintLean(o, rm);
}
// the key's text shadow in whole px and alpha steps of 0.02, so a scroll rewrites it a third as often
export function paintType(t: TypeEl) {
  const h = t.h * HS();
  const kp = project(t.vx, t.vy, h, 3);
  const a = Math.round(0.55 * key.gain * keyPool(t.vx, t.vy) * 50) / 50;
  const s = `${String(Math.round(kp.dx))}px ${String(Math.round(kp.dy))}px ${(2 + 0.6 * h).toFixed(1)}px color-mix(in srgb, var(--shade-k) ${String(Math.round(a * 100))}%, transparent)`;
  if (s !== t.mem) {
    t.mem = s;
    t.el.style.textShadow = s;
  }
}
