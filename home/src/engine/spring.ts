// springs (f in Hz, z damping ratio)
export interface Spring {
  x: number;
  v: number;
  t: number;
  f: number;
  z: number;
  eps: number;
}
const TAU = Math.PI * 2;
export const spring = (x: number, f = 4, z = 0.6, eps = 0.01): Spring => ({
  x,
  v: 0,
  t: x,
  f,
  z,
  eps,
});
export function stepSpring(s: Spring, dt: number): boolean {
  if (s.x === s.t && s.v === 0) {
    return false;
  }
  const w = TAU * s.f;
  const n = Math.ceil(dt / 0.004);
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v += (-w * w * (s.x - s.t) - 2 * s.z * w * s.v) * h;
    s.x += s.v * h;
  }
  if (Math.abs(s.x - s.t) < s.eps && Math.abs(s.v) < s.eps * 10) {
    s.x = s.t;
    s.v = 0;
    return false;
  }
  return true;
}
