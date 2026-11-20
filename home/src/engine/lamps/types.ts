import type { Shelf } from "../frame";
import type { Spring } from "../spring";

import type { Rect } from "./math";

// v27's lamps (DESIGN-SPEC-R10 section 1, rounds 11 to 13): additive, hard-edged discs, a spotlight swing on placement, a shadow
// per lamp from every object (the object's outline displaced at most shadowPx), washes laid on with overlay
export const P = {
  s: 1,
  amp: [0.105, 0.165, 0.14],
  yk: 0.96,
  add: { open: 0.26, margin: 0.02, feather: 90 },
  cap: 0.45,
  labelCap: [0.54, 0.32, 0.35],
  disc: 0.8,
  reach: [0.8, 0.58],
  z: 44,
  shadowPx: [28, 22],
} as const;
export const BASE = [33, 64, 44] as const;

export interface Lamp {
  slot: number;
  px: number;
  py: number;
  g: number;
  rgb: [number, number, number];
  amp: [number, number, number];
  R: number;
  z: number;
  shape: Float32Array | null;
  sig: string;
  sigF: string;
  gx: number;
  gy: number;
  n: number;
  ox: number;
  oy: number;
  sx: number;
  sy: number;
  aim: Spring[] | null;
  b: number;
  tail: boolean;
  at: [number, number, number, number];
  prof: Float32Array | null;
  profK: string;
}
export const mkLamp = (slot: number): Lamp => ({
  slot,
  px: 0,
  py: 0,
  g: 0,
  rgb: [0, 0, 0],
  amp: [0, 0, 0],
  R: 0,
  z: 0,
  shape: null,
  sig: "",
  sigF: "",
  gx: 0,
  gy: 0,
  n: 0,
  ox: 0,
  oy: 0,
  sx: 0,
  sy: 0,
  aim: null,
  b: 0,
  tail: false,
  at: [0, 0, 0, 0],
  prof: null,
  profK: "",
});
// the pool's centre and the point its shadows are cast from: the lamp's page point plus the swing's offsets (zero at rest)
export const cxOf = (L: Lamp) => L.px + L.ox;
export const cyOf = (L: Lamp) => L.py + L.oy;
export const sxOf = (L: Lamp) => L.px + L.sx;
export const syOf = (L: Lamp) => L.py + L.sy;
export const lit = (L: Lamp) => L.g > 0.002;

// a text block the lamps hold their light back near
export interface Block {
  el: HTMLElement;
  well: boolean;
  r: Rect | null;
  lines: Rect[];
  shelf: Shelf | null;
  fixed: boolean;
  cap: number;
  sl: number;
}
