import { describe, expect, it } from "vitest";

import { cleanTap, type Down } from "./input";

const down: Down = { x: 100, y: 100, t: 1000, ok: true, touch: false };
describe("the tap rule", () => {
  it("lands a lamp on a short, still press that began on bare ground", () => {
    expect(cleanTap(down, 106, 104, 1500, 0)).toBe(true);
  });
  it("refuses a press that wandered, lingered, followed a scroll or began on something", () => {
    expect(cleanTap(down, 111, 100, 1500, 0)).toBe(false);
    expect(cleanTap(down, 100, 100, 1601, 0)).toBe(false);
    expect(cleanTap(down, 100, 100, 1500, 1200)).toBe(false);
    expect(cleanTap({ ...down, ok: false }, 100, 100, 1500, 0)).toBe(false);
  });
});
