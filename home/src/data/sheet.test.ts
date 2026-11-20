import { describe, expect, it } from "vitest";

import { printSizes, rowsOf } from "./sheet";

describe("a set's rows", () => {
  it("keeps the order and puts every print in exactly one row", () => {
    const ars = [1.5, 0.667, 1.5, 1.5, 1, 1.5, 0.75];
    const rows = rowsOf(ars);
    expect(rows.flat()).toEqual(ars.map((_, i) => i));
  });
  it("sets 3:2 prints two to a row (they fill it at the target height) and gives an upright pair its own row", () => {
    expect(rowsOf([1.5, 1.5, 1.5, 1.5, 1.5, 1.5])).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ]);
    expect(rowsOf([0.667, 0.667])).toEqual([[0, 1]]);
  });
  it("sizes each print by its row, window by window, then by the column", () => {
    const ars = [1.5, 1.5, 1.5];
    const [first] = printSizes(ars, rowsOf(ars));
    expect(first).toMatch(/^\(min-width: 1260px\) [\d.]+px, /);
    expect(first).toContain("(min-width: 700px) calc((100vw - ");
    expect(first?.endsWith("(min-width: 600px) calc(100vw - 64px), calc(100vw - 32px)")).toBe(true);
  });
});
