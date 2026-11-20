// Stage 2: the lit lamps of each group of touching pools summed in linear light into one canvas in .fx. Lamps add light: the
// sum is shown as the colour and alpha that reproduce it on the key's brightest ground, so overlaps grow brighter and paler
// (toward white with all three). The limit is the ground's luminance, per pixel: open ground may reach add.open; near a line of
// text only what keeps that text at 4.5 (3 for display) with add.margin for the grain; a soft shoulder rather than a clip.
import { f0 } from "../env";
import { sl, SX, SY, type Shelf } from "../frame";
import { made, mk } from "../scope";

import { at, encF, lin, smooth, Y, type Rect } from "./math";
import { BASE, lit, P, type Block, type Lamp } from "./types";

type Cells = [number, number, number, number]; // c0, c1, r0, r1
interface LightMap {
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  img: ImageData | null;
  d32: Uint32Array;
  w: number;
  h: number;
  gx: number;
  gy: number;
  ov: number;
  capK: string;
  capS: Float32Array;
  capF: Float32Array;
  mc: HTMLCanvasElement | null;
  mx: CanvasRenderingContext2D | null;
  at: string;
}
export interface Stage {
  S: number;
  fx: HTMLElement;
  fxEnd: HTMLElement | null;
  ovPx: number;
  endTop: number;
  endH: number;
  textVer: number;
  blocks: Block[];
  fixedBlocks: Block[];
  shelves: Shelf[];
}
const LB = BASE.map(lin);
export const YB = Y(...BASE);
const OPEN = P.add.open;
const maps: LightMap[] = [];
let sum = new Float32Array(0);
let capF = new Float32Array(0);

export function resetMaps() {
  maps.length = 0;
}
function getMap(st: Stage, i: number): LightMap {
  const old = maps[i];
  if (old) {
    return old;
  }
  const cv = mk("canvas", "lm");
  cv.style.cssText = "left:0;top:0;transform-origin:0 0;";
  st.fx.insertBefore(cv, st.fx.querySelector(".grain"));
  const M: LightMap = {
    cv,
    ctx: cv.getContext("2d"),
    img: null,
    d32: new Uint32Array(0),
    w: 0,
    h: 0,
    gx: 0,
    gy: 0,
    ov: 0,
    capK: "",
    capS: new Float32Array(0),
    capF: new Float32Array(0),
    mc: null,
    mx: null,
    at: "",
  };
  maps[i] = M;
  return M;
}
function hideMap(M: LightMap) {
  M.cv.style.display = "none";
  if (M.mc) {
    M.mc.style.display = "none";
  }
}
export function hideAll() {
  for (const M of maps) {
    hideMap(M);
  }
}
// groups: lamps whose pools touch
function groups(on: Lamp[]): Lamp[][] {
  const grp = on.map((_, i) => i);
  const find = (i: number): number => {
    const p = grp[i] ?? i;
    if (p === i) {
      return i;
    }
    const r = find(p);
    grp[i] = r;
    return r;
  };
  on.forEach((a, i) => {
    on.forEach((b, j) => {
      if (j > i && Math.hypot(a.px - b.px, a.py - b.py) < a.R + b.R) {
        grp[find(i)] = find(j);
      }
    });
  });
  const sets = new Map<number, Lamp[]>();
  on.forEach((L, i) => {
    const r = find(i);
    sets.set(r, [...(sets.get(r) ?? []), L]);
  });
  return [...sets.values()];
}
// the summed light of a group's lamps into `sum` (w wide, from grid gx, gy), within cells C
function accumulate(ls: Lamp[], gx: number, gy: number, w: number, C: Cells) {
  const [c0, c1, r0, r1] = C;
  for (const L of ls) {
    const [ar, ag, ab] = L.amp;
    const { g, n, shape: sh } = L;
    const ox = L.gx - gx;
    const oy = L.gy - gy;
    if (!sh) {
      continue;
    }
    const i0 = Math.max(c0, ox);
    const i1 = Math.min(c1, ox + n - 1);
    for (let j = Math.max(r0, oy); j <= Math.min(r1, oy + n - 1); j++) {
      let p = (j * w + i0) * 3;
      let q = (j - oy) * n + (i0 - ox);
      for (let i = i0; i <= i1; i++, p += 3, q++) {
        const v = at(sh, q) * g;
        if (v) {
          sum[p] = at(sum, p) + ar * v;
          sum[p + 1] = at(sum, p + 1) + ag * v;
          sum[p + 2] = at(sum, p + 2) + ab * v;
        }
      }
    }
  }
}
function place(st: Stage, M: LightMap, gx: number, gy: number, w: number, h: number) {
  if ((M.w !== w || M.h !== h) && M.ctx) {
    M.cv.width = w;
    M.cv.height = h;
    M.w = w;
    M.h = h;
    M.img = M.ctx.createImageData(w, h);
    M.d32 = new Uint32Array(M.img.data.buffer);
    M.cv.style.width = `${f0(w * st.S)}px`;
    M.cv.style.height = `${f0(h * st.S)}px`;
  }
  if (M.gx !== gx || M.gy !== gy || M.ov !== st.ovPx) {
    M.gx = gx;
    M.gy = gy;
    M.ov = st.ovPx;
    M.cv.style.transform = `translate(${f0(gx * st.S)}px, ${String(gy * st.S + st.ovPx)}px)`;
  }
  M.cv.style.display = "";
}
// a partial remake (B): the cells of this map inside the box, if the map is where it was
function partCells(
  st: Stage,
  M: LightMap,
  B: Rect,
  gx: number,
  gy: number,
  w: number,
  h: number
): Cells | null {
  if (M.w !== w || M.h !== h || M.gx !== gx || M.gy !== gy || M.ov !== st.ovPx) {
    return null;
  }
  const { S } = st;
  return [
    Math.max(0, Math.floor(B[0] / S) - gx - 1),
    Math.min(w - 1, Math.ceil(B[2] / S) - gx + 1),
    Math.max(0, Math.floor(B[1] / S) - gy - 1),
    Math.min(h - 1, Math.ceil(B[3] / S) - gy + 1),
  ];
}
function extent(ls: Lamp[]): [number, number, number, number] {
  const gx = Math.min(...ls.map(L => L.gx));
  const gy = Math.min(...ls.map(L => L.gy));
  return [
    gx,
    gy,
    Math.max(...ls.map(L => L.gx + L.n)) - gx,
    Math.max(...ls.map(L => L.gy + L.n)) - gy,
  ];
}
function clear(C: Cells | null, w: number, h: number) {
  if (C) {
    for (let j = C[2]; j <= C[3]; j++) {
      sum.fill(0, (j * w + C[0]) * 3, (j * w + C[1] + 1) * 3);
    }
  } else if (sum.length < w * h * 3) {
    sum = new Float32Array(w * h * 3);
  } else {
    sum.fill(0, 0, w * h * 3);
  }
}
function drawGroup(st: Stage, M: LightMap, ls: Lamp[], B: Rect | null) {
  const [gx, gy, w, h] = extent(ls);
  const part = B ? partCells(st, M, B, gx, gy, w, h) : null;
  if (part && (part[0] > part[1] || part[2] > part[3])) {
    return;
  }
  if (!part) {
    place(st, M, gx, gy, w, h);
  }
  clear(part, w, h);
  const C: Cells = part ?? [0, w - 1, 0, h - 1];
  accumulate(ls, gx, gy, w, C);
  textField(st, M, w * h, w, h, gx, gy);
  encode(M, w, C);
  if (M.img) {
    M.ctx?.putImageData(M.img, 0, 0, C[0], C[2], C[1] - C[0] + 1, C[3] - C[2] + 1);
  }
  mirror(st, M, part);
}
export function combine(st: Stage, lamps: Lamp[], B: Rect | null = null) {
  const sets = groups(lamps.filter(L => lit(L) && L.shape));
  sets.forEach((ls, i) => {
    drawGroup(st, getMap(st, i), ls, B);
  });
  if (!B) {
    for (const M of maps.slice(sets.length)) {
      hideMap(M);
    }
  }
}

// ---- the ceiling field: per cell, the luminance the ground may reach. It depends only on text geometry, the shelves' travel and
// (fixed text) the scroll, never on the lamps: each map keeps the page's part (keyed by the layout, the map's place and the
// shelves' travel); the fixed text (the nav button's label) is laid over a copy each time ----
function hold(st: Stage, b: Block, w: number, h: number, gx: number, gy: number) {
  const pad = 6;
  let dx = 0;
  let dy = 0;
  if (b.fixed) {
    dx = SX();
    dy = SY();
  } else if (b.shelf) {
    dx = -(sl(b.shelf) - b.shelf.give - b.sl);
  }
  const R = b.lines.map(
    (r): Rect => [r[0] + dx - pad, r[1] + dy - pad, r[2] + dx + pad, r[3] + dy + pad]
  );
  holdBack(st.S, R, b.cap, w, h, gx, gy);
}
function textField(
  st: Stage,
  M: LightMap,
  N: number,
  w: number,
  h: number,
  gx: number,
  gy: number
) {
  const key = [st.textVer, gx, gy, w, h, ...st.shelves.map(e => sl(e) - e.give)].join();
  if (M.capK !== key) {
    if (M.capS.length < N) {
      M.capS = new Float32Array(N);
    }
    capF = M.capS;
    capF.fill(OPEN, 0, N);
    for (const b of st.blocks) {
      if (b.r && b.cap < OPEN && !b.fixed) {
        hold(st, b, w, h, gx, gy);
      }
    }
    M.capK = key;
  }
  if (!st.fixedBlocks.length) {
    capF = M.capS;
    return;
  }
  if (M.capF.length < N) {
    M.capF = new Float32Array(N);
  }
  ({ capF } = M);
  capF.set(M.capS.subarray(0, N));
  for (const b of st.fixedBlocks) {
    hold(st, b, w, h, gx, gy);
  }
}
// the nearest squared distance from a cell to the lines, at most F2
function nearest2(R: Rect[], x: number, y: number, F2: number) {
  let m = F2;
  for (const r of R) {
    const ax = Math.max(r[0] - x, 0, x - r[2]);
    const ay = Math.max(r[1] - y, 0, y - r[3]);
    const q = ax * ax + ay * ay;
    if (q < m) {
      m = q;
    }
  }
  return m;
}
// the ceiling near a block's lines of text: the text's cap on a line, easing to open ground over the feather from the nearest
// line. By lines, not the block's box, so the blank beside a short line lights as open ground.
function holdBack(S: number, R: Rect[], cap: number, w: number, h: number, gx: number, gy: number) {
  if (!R.length) {
    return;
  }
  const F = P.add.feather;
  const F2 = F * F;
  const i0 = Math.max(0, Math.floor((Math.min(...R.map(r => r[0])) - F) / S) - gx);
  const i1 = Math.min(w - 1, Math.ceil((Math.max(...R.map(r => r[2])) + F) / S) - gx);
  const j0 = Math.max(0, Math.floor((Math.min(...R.map(r => r[1])) - F) / S) - gy);
  const j1 = Math.min(h - 1, Math.ceil((Math.max(...R.map(r => r[3])) + F) / S) - gy);
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const m = nearest2(R, (gx + i + 0.5) * S, (gy + j + 0.5) * S, F2);
      if (m >= F2) {
        continue;
      }
      const c = cap + (OPEN - cap) * smooth(Math.sqrt(m) / F);
      const k = j * w + i;
      if (c < at(capF, k)) {
        capF[k] = c;
      }
    }
  }
}
function encode(M: LightMap, w: number, C: Cells) {
  for (let j = C[2]; j <= C[3]; j++) {
    encodeRun(M.d32, j * w + C[0], j * w + C[1]);
  }
}
const B0 = BASE[0];
const B1 = BASE[1];
const B2 = BASE[2];
const L0 = LB[0] ?? 0;
const L1 = LB[1] ?? 0;
const L2 = LB[2] ?? 0;
// one pixel: the light under its ceiling (a soft shoulder from 75% of the allowed rise), then the colour and alpha that put it
// on the key's brightest ground
function pixel(k: number, p: number) {
  let r = at(sum, p);
  let g = at(sum, p + 1);
  let b = at(sum, p + 2);
  const ys = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (ys < 1e-5) {
    return 0;
  }
  const D = at(capF, k) - YB;
  const kn = 0.75 * D;
  if (ys > kn) {
    const f = (kn + (D - kn) * (1 - Math.exp(-(ys - kn) / (D - kn)))) / ys;
    r *= f;
    g *= f;
    b *= f;
  }
  const tr = encF(L0 + r);
  const tg = encF(L1 + g);
  const tb = encF(L2 + b);
  const a = Math.max((tr - B0) / (255 - B0), (tg - B1) / (255 - B1), (tb - B2) / (255 - B2));
  if (a <= 0.002) {
    return 0;
  }
  const cr = B0 + (tr - B0) / a;
  const cg = B1 + (tg - B1) / a;
  const cb = B2 + (tb - B2) / a;
  return (
    ((((a * 255 + 0.5) | 0) << 24) |
      (((cb + 0.5) | 0) << 16) |
      (((cg + 0.5) | 0) << 8) |
      ((cr + 0.5) | 0)) >>>
    0
  );
}
// the pixels k0 to k1 (one map row's run, or the whole map)
function encodeRun(d32: Uint32Array, k0: number, k1: number) {
  for (let k = k0, p = k0 * 3; k <= k1; k++, p += 3) {
    d32[k] = pixel(k, p);
  }
}

// ---- overscroll: .fx stops short of the document's end and a strip (.fx-end) is the sheet there: its own grain in the sheet's
// phase and a copy of each lightmap that reaches it (the same pixels, put on the same frame). Only the strip is reflected. ----
// a map's copy in the strip (C: the cells just made; by default all): only the map's rows that reach the strip, one past each
// edge; a partial remake outside them leaves it, and its style, alone
function mirror(st: Stage, M: LightMap, C0: Cells | null) {
  const rows = stripRows(st, M);
  if (!rows || !M.img || !st.fxEnd) {
    return;
  }
  const [ra, rb, y0] = rows;
  if (C0 && (C0[3] < ra || C0[2] > rb) && M.mc?.style.display === "") {
    return;
  }
  const fresh = strip(st, M, st.fxEnd, ra, rb, y0);
  const C: Cells = fresh || !C0 ? [0, M.w - 1, ra, rb] : C0;
  const j0 = Math.max(C[2], ra);
  const j1 = Math.min(C[3], rb);
  M.mx?.putImageData(M.img, 0, -ra, C[0], j0, C[1] - C[0] + 1, j1 - j0 + 1);
}
// the map's rows that reach the strip (a row past each edge, for the smooth scaling there) and its top, or null (its copy hidden)
function stripRows(st: Stage, M: LightMap): [number, number, number] | null {
  const { S } = st;
  const y0 = M.gy * S + st.ovPx;
  if (y0 + M.h * S > st.endTop && y0 < st.endTop + st.endH) {
    return [
      Math.max(0, Math.floor((st.endTop - y0) / S) - 1),
      Math.min(M.h - 1, Math.ceil((st.endTop + st.endH - y0) / S)),
      y0,
    ];
  }
  if (M.mc) {
    M.mc.style.display = "none";
  }
  return null;
}
// the strip's canvas for map M, placed; true when it was (re)made, so every row is copied
function strip(st: Stage, M: LightMap, end: HTMLElement, ra: number, rb: number, y0: number) {
  if (!M.mc) {
    M.mc = made(document.createElement("canvas"));
    M.mc.className = "lm";
    M.mc.setAttribute("aria-hidden", "true");
    end.insertBefore(M.mc, end.lastChild);
    M.mx = M.mc.getContext("2d");
  }
  const c = M.mc;
  const n = rb - ra + 1;
  const key = [M.cv.style.cssText, ra, st.endTop].join("|");
  let fresh = false;
  if (c.width !== M.w || c.height !== n || M.at !== key) {
    if (c.width !== M.w || c.height !== n) {
      c.width = M.w;
      c.height = n;
    }
    M.at = key;
    fresh = true;
    c.style.cssText = M.cv.style.cssText;
    c.style.height = `${String(n * st.S)}px`;
    c.style.transform = `translate(${String(M.gx * st.S)}px, ${String(y0 + ra * st.S - st.endTop)}px)`;
  }
  if (c.style.display) {
    c.style.display = "";
  }
  return fresh;
}
