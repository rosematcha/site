// The visitor's lamps (DESIGN-SPEC-R10 section 1): each placed lamp is a coloured point light standing low over the sheet.
// Ground: a CPU lightmap. Per lamp a cached single-channel shape (its disc times the shadows its objects cut in it) on a 4 px
// lattice (6 on phones); every frame a lamp's strength or colour changes, the shapes are summed per group of touching pools and
// written to one canvas per group in .fx. Objects: a lit edge and a wash on the side facing each lamp. Scrolling the page does
// no lamp work beyond the fixed nav plate's box: all of it is page-anchored.
import { $, HS, idle, PHONE, RM, VP } from "../env";
import { sl, SX, SY, type Shelf } from "../frame";
import type { HandLight } from "../input";
import { shelfDx, type Obj } from "../objects";
import { mk, signal } from "../scope";
import { spring, stepSpring } from "../spring";

import { collectBlocks, measureBlocks } from "./blocks";
import { combine, hideAll, resetMaps, type Stage } from "./combine";
import { grow, lin, nearestOn, type Rect } from "./math";
import { shadowBox, shape, shapeIn, type Geo } from "./shape";
import { objLight } from "./surface";
import { cxOf, cyOf, lit, mkLamp, P, sxOf, syOf, type Block, type Lamp } from "./types";

export interface Lamps {
  lamps: Lamp[];
  readonly combineMs: number;
  paint: (slots: HandLight[]) => void;
  frame: (dt: number) => boolean;
  layout: () => void;
}
interface Ctx {
  objs: Obj[];
  shelves: Shelf[];
  fx: HTMLElement;
  shelfOf: (el: Element) => Shelf | null;
}
// CSS px per lightmap px: 4, 6 on phones (slower CPU, smaller pools)
const lattice = () => (PHONE() ? 6 : 4);
const reach = () => (PHONE() ? 0.58 * 0.62 : 0.8 * 0.44) * Math.min(VP.w, VP.h);
const zOf = () => (PHONE() ? (P.z * 90) / 110 : P.z);
// the yellow slot warms toward rgb(255 245 64) on the ground, so magenta plus yellow lands on a warm near-white
function setAmp(L: Lamp) {
  const [r, g, b] = L.rgb;
  const rgb = L.slot === 1 ? [r, g * P.yk, Math.max(b, (64 * g) / 255)] : L.rgb;
  const k = (P.amp[L.slot] ?? 0) * P.s;
  L.amp = [k * lin(rgb[0] ?? 0), k * lin(rgb[1] ?? 0), k * lin(rgb[2] ?? 0)];
}
// While the menu or a photo viewer is open the page is hidden, so its objects cut no shadows: lit lamps fade on bare ground
const bare = () =>
  document.documentElement.classList.contains("menu-open") ||
  document.documentElement.classList.contains("viewer-open");
// the fixed nav button is a plate only while it shows as one: only then does it take light and cast
const navShown = () =>
  document.documentElement.classList.contains("plated") &&
  (PHONE() || document.documentElement.classList.contains("stand"));
const rectOf = (o: Obj): Rect => {
  const dx = o.fixed ? -SX() : shelfDx(o.shelf);
  const dy = o.fixed ? -SY() : 0;
  const cx = o.px - dx;
  const cy = o.py - dy;
  return [cx - o.w / 2, cy - o.hh / 2, cx + o.w / 2, cy + o.hh / 2];
};
const casts = (o: Obj) => Boolean(o.w) && !o.nolamp && (!o.fixed || navShown());

// the swing: a new lamp arrives 16 px further out along the line from the window's centre through its spot and settles inward
// with a small overshoot, an operator aiming a spot; its shadows follow on a slower spring, so they sweep after the pool
function aimStart(L: Lamp) {
  if (RM()) {
    return;
  }
  const dx = L.px - SX() - VP.w / 2;
  const dy = L.py - SY() - VP.h / 2;
  const d = Math.hypot(dx, dy);
  const [ax, ay] = d > 1 ? [(16 * dx) / d, (16 * dy) / d] : [0, -16];
  const sp = (v: number, f: number, z: number) => ({ ...spring(v, f, z, 0.05), t: 0 });
  L.aim = [sp(ax, 2.2, 0.55), sp(ay, 2.2, 0.55), sp(ax, 1.6, 0.62), sp(ay, 1.6, 0.62)];
}
function aimStep(L: Lamp, dt: number) {
  if (!L.aim) {
    return false;
  }
  let run = false;
  for (const s of L.aim) {
    run = stepSpring(s, dt) || run;
  }
  const [ox = 0, oy = 0, sx = 0, sy = 0] = L.aim.map(s => s.x);
  Object.assign(L, { ox, oy, sx, sy });
  if (!run) {
    L.aim = null;
  }
  return run;
}

export function initLamps({ objs, shelves, fx, shelfOf }: Ctx): Lamps {
  const HC = window.matchMedia("(prefers-contrast: more)");
  const lamps = [0, 1, 2].map(mkLamp);
  const fxEnd = mk("div", "fx-end");
  fx.after(fxEnd);
  mk("div", "grain", fxEnd);
  resetMaps();
  const geo: Geo = { objs, S: lattice(), phone: PHONE(), bare, casts, rectOf };
  const st: Stage = {
    S: geo.S,
    fx,
    fxEnd,
    ovPx: 0,
    endTop: 0,
    endH: 0,
    textVer: 0,
    blocks: [],
    fixedBlocks: [],
    shelves,
  };
  st.blocks = collectBlocks([], shelfOf);
  let dirty = true;
  let geoDirty = true;
  let lastActive = false;
  let tick = 0;
  let lastFixed: Rect | null = null;
  let shelfSig = "";
  let combineMs = 0;

  const measureText = () => {
    st.textVer++;
    st.fixedBlocks = measureBlocks(st.blocks);
    geoDirty = false;
  };
  const run = (B: Rect | null = null) => {
    const t0 = performance.now();
    combine(st, lamps, B);
    combineMs = performance.now() - t0;
  };
  // two signatures, the page's (the lamp and the page-anchored objects in its reach) and the fixed objects' (the nav plate); when
  // only the second changes, only the region the fixed objects touch is made again
  function shapeSig(L: Lamp): [string, string] {
    let s = `${[cxOf(L), cyOf(L), sxOf(L), syOf(L)].map(v => Math.round(v)).join()},${L.R.toFixed(0)}`;
    let f = "";
    if (bare()) {
      return [`${s}|bare`, ""];
    }
    for (const o of objs) {
      const t = casts(o) ? castSig(o, L) : "";
      if (o.fixed) {
        f += t;
      } else {
        s += t;
      }
    }
    return [s, f];
  }
  function castSig(o: Obj, L: Lamp) {
    const r = rectOf(o);
    const [nx, ny] = nearestOn(r, cxOf(L), cyOf(L));
    if (Math.hypot(nx - cxOf(L), ny - cyOf(L)) >= L.R) {
      return "";
    }
    return `|${r.map(Math.round).join()},${String(Math.round((o.h + o.lift.x) * HS()))}`;
  }
  // everything fixed the lightmap reads, as one page box: the casting fixed objects' shadows and fixed text's hold-back
  function fixedBox() {
    let B: Rect | null = null;
    if (!bare()) {
      for (const o of objs) {
        if (o.fixed && casts(o)) {
          B = grow(B, shadowBox(geo, o));
        }
      }
    }
    for (const b of st.blocks) {
      B = grow(B, holdBox(b));
    }
    return B;
  }
  function holdBox(b: Block) {
    if (!b.fixed || !b.r || b.cap >= P.add.open) {
      return null;
    }
    const F = P.add.feather + 6 + st.S;
    const x = SX();
    const y = SY();
    let B: Rect | null = null;
    for (const r of b.lines) {
      B = grow(B, [r[0] + x - F, r[1] + y - F, r[2] + x + F, r[3] + y + F]);
    }
    return B;
  }
  const shelfMoved = () => {
    const s = shelves.map(e => Math.round(sl(e) - e.give)).join();
    const m = s !== shelfSig;
    shelfSig = s;
    return m;
  };
  const tailOnly = () => lamps.every(L => !lit(L) || L.tail);
  // geometry: reshape a lit lamp whose pool, objects or their lift moved; where only the fixed objects moved (a scroll under the
  // nav plate), only the box they and the fixed text touch, old place and new
  function reshape(box: Rect | null): [boolean, boolean] {
    let reshaped = false;
    let part = false;
    geo.phone = PHONE();
    for (const L of lamps.filter(lit)) {
      const [sp, sf] = shapeSig(L);
      if (sp !== L.sig || !L.shape) {
        L.sig = sp;
        L.sigF = sf;
        shape(geo, L);
        reshaped = true;
      } else if (sf !== L.sigF && box) {
        L.sigF = sf;
        shapeIn(geo, L, box);
        part = true;
      }
    }
    return [reshaped, part];
  }
  // the lamps' reach and height for this window, and the swing's step; true while a swing runs
  function settle(dt: number) {
    let swing = false;
    for (const L of lamps) {
      L.R = reach();
      L.z = zOf();
      swing = aimStep(L, dt) || swing;
    }
    return swing;
  }
  // combine; during a fade tail with nothing moving, at 30 Hz (the tail is slow and dim, a skipped frame doesn't show)
  function draw(reshaped: boolean, part: boolean, box: Rect | null) {
    if (dirty && !(tailOnly() && !reshaped && tick % 2)) {
      run();
      dirty = false;
    } else if (part && !dirty) {
      run(box);
    }
  }
  function frame(dt = 0) {
    const swing = settle(dt);
    const any = lamps.some(lit);
    if (!any && !lastActive) {
      return false;
    }
    if (geoDirty) {
      measureText();
    }
    const fb = fixedBox();
    const box = grow(lastFixed, fb);
    const [reshaped, part] = reshape(box);
    tick++;
    // a shelf's text moves its ceiling with it
    const moved = st.blocks.some(b => b.shelf) && shelfMoved();
    dirty = dirty || reshaped || moved;
    draw(reshaped, part && any, box);
    lastFixed = fb;
    if (!any) {
      hideAll();
    }
    const k = { hc: HC.matches, navShown: navShown(), rectOf };
    for (const o of objs) {
      objLight(o, lamps, k);
    }
    lastActive = any;
    return swing;
  }
  function paint(slots: HandLight[]) {
    slots.forEach((s, i) => {
      const L = lamps[i];
      if (!L) {
        return;
      }
      L.px = s.px;
      L.py = s.py;
      if (s.b !== L.b) {
        // a new placement
        L.b = s.b;
        L.aim = null;
        L.ox = 0;
        L.oy = 0;
        L.sx = 0;
        L.sy = 0;
        aimStart(L);
      }
      const rgb = s.rgb.map(Math.round) as [number, number, number];
      L.tail = s.f !== Infinity && performance.now() >= s.f;
      if (L.g !== s.g || rgb.join() !== L.rgb.join()) {
        L.g = s.g;
        L.rgb = rgb;
        setAmp(L);
        dirty = true;
      }
    });
  }
  function overscroll() {
    st.ovPx = -fx.offsetTop;
    st.endTop = fx.offsetHeight;
    st.endH = fxEnd.offsetHeight;
    const g = $(".grain", fxEnd);
    if (g) {
      g.style.backgroundPosition = `0 ${String(-(st.endTop % 192))}px`;
    }
  }
  // (layout measures the text blocks' lines in an idle callback, so the first frame of a tap doesn't pay for it)
  function layout() {
    st.blocks = collectBlocks(st.blocks, shelfOf);
    geoDirty = true;
    st.textVer++;
    const s = signal();
    idle(() => {
      if (!s.aborted && geoDirty) {
        measureText();
      }
    });
    overscroll();
    if (geo.S !== lattice()) {
      geo.S = lattice();
      st.S = geo.S;
      for (const L of lamps) {
        L.shape = null;
      }
    }
    for (const L of lamps) {
      L.sig = "";
    }
    dirty = true;
  }
  return {
    lamps,
    get combineMs() {
      return combineMs;
    },
    paint,
    frame,
    layout,
  };
}
