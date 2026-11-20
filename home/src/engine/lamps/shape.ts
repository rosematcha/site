// Stage 1: a lamp's shape, its disc times the shadows of the objects in its reach, on the global S px lattice.
// An object's shadow from one lamp is the hull of its footprint and its top face projected away from the lamp (each corner
// moved along its own ray, capped at shadowPx), built on the corners inset by the object's radius and grown back by it, so a
// pill stays a pill. It is this lamp's light taken away, so the other lamps' colours show in it; dense at the object, lighter
// toward its tip (the penumbra widens with distance from the object).
import { dist, HS, radius } from "../env";
import type { Obj } from "../objects";

import {
  at,
  E,
  edges,
  hull,
  nearestOn,
  planes,
  polyOut,
  smooth,
  type Edge,
  type Pt,
  type Rect,
} from "./math";
import { cxOf, cyOf, P, sxOf, syOf, type Lamp } from "./types";

export interface Geo {
  objs: Obj[];
  S: number;
  phone: boolean;
  bare: () => boolean;
  casts: (o: Obj) => boolean;
  rectOf: (o: Obj) => Rect;
}
type Cells = [number, number, number, number]; // i0, i1, j0, j1

// the page box a casting object's lamp shadow can reach: its rect grown by the offset's cap and the widest penumbra
export function shadowBox(g: Geo, o: Obj): Rect {
  const r = g.rectOf(o);
  const c = P.shadowPx[g.phone ? 1 : 0];
  const w = c + 1.5 + 0.3 * Math.max(1, c) + g.S;
  return [r[0] - w, r[1] - w, r[2] + w, r[3] + w];
}
interface HullCut {
  r: Rect;
  E2: Edge[];
  rad: number;
  len: number;
  box: Rect;
}
function hullOf(g: Geo, L: Lamp, o: Obj): HullCut {
  const [, , lx, ly] = L.at;
  const r = g.rectOf(o);
  const h = Math.max(0, (o.h + o.lift.x) * HS());
  const k = h / Math.max(8, L.z - h);
  const cap = P.shadowPx[g.phone ? 1 : 0];
  o.rad ??= radius(o.face);
  const rad = Math.max(0, Math.min(o.rad, (r[2] - r[0]) / 2, (r[3] - r[1]) / 2) - 0.5);
  const C: Pt[] = [
    [r[0] + rad, r[1] + rad],
    [r[2] - rad, r[1] + rad],
    [r[2] - rad, r[3] - rad],
    [r[0] + rad, r[3] - rad],
  ];
  const pts: Pt[] = [];
  let len = 1;
  for (const [cx, cy] of C) {
    let dx = (cx - lx) * k;
    let dy = (cy - ly) * k;
    const m = Math.hypot(dx, dy);
    if (m > cap) {
      dx *= cap / m;
      dy *= cap / m;
    }
    len = Math.max(len, Math.min(m, cap));
    pts.push([cx, cy], [cx + dx, cy + dy]);
  }
  const H = hull(pts);
  const xs = H.map(p => p[0]);
  const ys = H.map(p => p[1]);
  const box: Rect = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  return { r, E2: edges(H), rad, len, box };
}
function cellsOf(g: Geo, L: Lamp, c: HullCut, n: number, Z: Cells | null): Cells {
  const wMax = 1.5 + 0.3 * c.len + c.rad;
  const { S } = g;
  return [
    Math.max(Z ? Z[0] : 0, Math.floor((c.box[0] - wMax) / S) - L.gx),
    Math.min(Z ? Z[1] : n - 1, Math.ceil((c.box[2] + wMax) / S) - L.gx),
    Math.max(Z ? Z[2] : 0, Math.floor((c.box[1] - wMax) / S) - L.gy),
    Math.min(Z ? Z[3] : n - 1, Math.ceil((c.box[3] + wMax) / S) - L.gy),
  ];
}
// the share of a cell's light the hull keeps (1: untouched)
function keep(c: HullCut, x: number, y: number) {
  const { r, rad } = c;
  let sd = planes(c.E2, x, y);
  const dR = dist(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - y, 0, y - r[3]));
  const w = 1.5 + 0.3 * dR;
  // past the penumbra already by the planes (the exact distance is never less)
  if (sd - rad >= 0.5 * w) {
    return 1;
  }
  if (sd > 0 && rad) {
    sd = polyOut(c.E2, x, y);
  }
  const m = smooth(0.5 - (sd - rad) / w);
  return m ? 1 - m * 0.94 * (1 - 0.5 * Math.min(1, dR / c.len)) : 1;
}
// Z: the cells to touch (shapeIn); by default all of them
function castHull(g: Geo, a: Float32Array, L: Lamp, o: Obj, Z: Cells | null = null) {
  const [cx0, cy0] = L.at;
  const [nx, ny] = nearestOn(g.rectOf(o), cx0, cy0);
  if (E(Math.hypot(nx - cx0, ny - cy0), L.R) * P.s < 0.02) {
    return;
  }
  if (Z && outside(g, L, o, Z)) {
    return;
  }
  const c = hullOf(g, L, o);
  const { n, gx, gy } = L;
  const { S } = g;
  const [i0, i1, j0, j1] = cellsOf(g, L, c, n, Z);
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const q = j * n + i;
      const v = at(a, q);
      if (v) {
        a[q] = v * keep(c, (gx + i + 0.5) * S, (gy + j + 0.5) * S);
      }
    }
  }
}
function outside(g: Geo, L: Lamp, o: Obj, Z: Cells) {
  const B = shadowBox(g, o);
  const { S } = g;
  return (
    B[2] < (L.gx + Z[0]) * S ||
    B[0] > (L.gx + Z[1] + 1) * S ||
    B[3] < (L.gy + Z[2]) * S ||
    B[1] > (L.gy + Z[3] + 1) * S
  );
}
function profile(L: Lamp, a: Float32Array, S: number) {
  const { n, gx, gy } = L;
  const [lx, ly] = L.at;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      a[j * n + i] = E(dist((gx + i + 0.5) * S - lx, (gy + j + 0.5) * S - ly), L.R);
    }
  }
}
export function shape(g: Geo, L: Lamp) {
  const { R } = L;
  const { S } = g;
  const lx = cxOf(L);
  const ly = cyOf(L);
  const n = Math.ceil((2 * R) / S) + 2;
  const a = L.shape?.length === n * n ? L.shape : new Float32Array(n * n);
  L.gx = Math.floor((lx - R) / S);
  L.gy = Math.floor((ly - R) / S);
  L.n = n;
  // the centre and the shadows' source this shape was made from (shapeIn keeps to them)
  L.at = [lx, ly, sxOf(L), syOf(L)];
  // the pool's profile is kept per lamp while its centre, reach and lattice hold (a scroll or a shelf's travel moves only the
  // shadows)
  const pk = [lx, ly, R, S, n].join();
  if (L.profK === pk && L.prof) {
    a.set(L.prof);
  } else {
    profile(L, a, S);
    L.prof = L.prof?.length === a.length ? L.prof : new Float32Array(a.length);
    L.prof.set(a);
    L.profK = pk;
  }
  if (!g.bare()) {
    for (const o of g.objs) {
      if (g.casts(o)) {
        castHull(g, a, L, o);
      }
    }
  }
  L.shape = a;
}
// only the cells inside page box B made again (the fixed nav plate moved through the map), with the same arithmetic
export function shapeIn(g: Geo, L: Lamp, B: Rect) {
  const { gx, gy, n, shape: a, prof } = L;
  const { S } = g;
  if (!a || !prof) {
    return;
  }
  const C: Cells = [
    Math.max(0, Math.floor(B[0] / S) - gx - 1),
    Math.min(n - 1, Math.ceil(B[2] / S) - gx + 1),
    Math.max(0, Math.floor(B[1] / S) - gy - 1),
    Math.min(n - 1, Math.ceil(B[3] / S) - gy + 1),
  ];
  if (C[0] > C[1] || C[2] > C[3]) {
    return;
  }
  for (let j = C[2]; j <= C[3]; j++) {
    a.set(prof.subarray(j * n + C[0], j * n + C[1] + 1), j * n + C[0]);
  }
  if (!g.bare()) {
    for (const o of g.objs) {
      if (g.casts(o)) {
        castHull(g, a, L, o, C);
      }
    }
  }
}
