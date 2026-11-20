// The lamps' pure arithmetic: colour transfer, the disc profile, hulls and distances.
export type Rect = [number, number, number, number];
export type Pt = [number, number];
// an edge of a convex polygon: its start, outward normal, direction and squared length
export type Edge = [number, number, number, number, number, number, number];

export const lin = (c255: number) => {
  const c = c255 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const enc = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
export const Y = (r: number, g: number, b: number) =>
  0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const smooth = (m: number) => {
  if (m <= 0) {
    return 0;
  }
  return m >= 1 ? 1 : m * m * (3 - 2 * m);
};
export const at = (a: Float32Array, i: number) => a[i] ?? 0;

// a disc with a hard-ish edge, like a 90% brush: near full strength out to `disc` of the radius (a slight hot centre, 1 to
// .92), then a short smoothstep to nothing; indexed by (d / R)^2 * 1024
function discProfile(disc: number) {
  const T = new Float32Array(1025);
  for (let i = 0; i <= 1024; i++) {
    const t = Math.sqrt(i / 1024);
    if (t <= disc) {
      T[i] = 1 - 0.08 * (t / disc) ** 2;
    } else {
      const u = (1 - t) / (1 - disc);
      T[i] = 0.92 * u * u * (3 - 2 * u);
    }
  }
  return T;
}
const PR = discProfile(0.8);
export const E = (d: number, R: number) => (d >= R ? 0 : at(PR, Math.round((d / R) ** 2 * 1024)));

// linear 0..1 -> sRGB 0..255, read with interpolation
const ENCF = new Float32Array(4097);
for (let i = 0; i <= 4096; i++) {
  ENCF[i] = 255 * enc(i / 4096);
}
export const encF = (v: number) => {
  if (v >= 1) {
    return 255;
  }
  const x = v * 4096;
  const i = x | 0;
  const a = at(ENCF, i);
  return a + (at(ENCF, i + 1) - a) * (x - i);
};

const cross = (o: Pt, a: Pt, b: Pt) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
function chain(pts: Pt[]) {
  const out: Pt[] = [];
  for (const p of pts) {
    while (out.length > 1 && cross(out[out.length - 2] ?? p, out[out.length - 1] ?? p, p) <= 0) {
      out.pop();
    }
    out.push(p);
  }
  return out.slice(0, -1);
}
// the convex hull of a few points (monotone chain), counter-clockwise in screen coordinates' sense of the cross product
export function hull(pts: Pt[]): Pt[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return chain(s).concat(chain(s.reverse()));
}
export function edges(H: Pt[]): Edge[] {
  return H.map((p, i) => {
    const q = H[(i + 1) % H.length] ?? p;
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    const el = Math.hypot(ex, ey) || 1;
    return [p[0], p[1], ey / el, -ex / el, ex, ey, el * el];
  });
}
// the signed distance by the edges' planes (a lower bound of the distance outside)
export function planes(E2: Edge[], x: number, y: number) {
  let sd = -Infinity;
  for (const e of E2) {
    const d = (x - e[0]) * e[2] + (y - e[1]) * e[3];
    if (d > sd) {
      sd = d;
    }
  }
  return sd;
}
// the distance from a point outside a convex polygon to it: the nearest of its edges
export function polyOut(E2: Edge[], x: number, y: number) {
  let best = Infinity;
  for (const e of E2) {
    const t = Math.max(0, Math.min(1, ((x - e[0]) * e[4] + (y - e[1]) * e[5]) / (e[6] || 1)));
    const dx = x - e[0] - t * e[4];
    const dy = y - e[1] - t * e[5];
    const d = dx * dx + dy * dy;
    if (d < best) {
      best = d;
    }
  }
  return Math.sqrt(best);
}
export const nearestOn = (r: Rect, x: number, y: number): Pt => [
  Math.max(r[0], Math.min(r[2], x)),
  Math.max(r[1], Math.min(r[3], y)),
];
export const grow = (A: Rect | null, B: Rect | null): Rect | null => {
  if (!A) {
    return B;
  }
  if (!B) {
    return A;
  }
  return [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])];
};
