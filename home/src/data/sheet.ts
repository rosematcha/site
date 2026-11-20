// A set's sheet of prints in justified rows (from 700 px). The prints are split into rows once, for every width, keeping their
// order: a filled row of aspects summing S with n prints stands fillAt times the target height (a third of the column), and the
// split is the one whose rows stand nearest the target at 700, 940 and 1260 px (the cost is the squared log of each row's ratio).
// Every row but the last fills the column; the last keeps the target height unless that overflows, then fills.
const fillAt = (S: number, n: number, W: number, g: number) =>
  (3.05 * (W - (n - 1) * g)) / (S * (W - g));
const REF: [number, number][] = [
  [636, 16],
  [860, 24],
  [1180, 24],
];
const cost = (S: number, n: number, end: boolean) =>
  REF.reduce((a, [W, g]) => {
    const r = fillAt(S, n, W, g);
    return a + (end && r >= 1 ? 0 : Math.log(r) ** 2);
  }, 0);

export function rowsOf(ars: number[]): number[][] {
  const N = ars.length;
  const best = [0];
  const from: number[] = [];
  for (let i = 1; i <= N; i++) {
    best[i] = Infinity;
    let S = 0;
    for (let j = i - 1; j >= 0; j--) {
      S += ars[j] ?? 0;
      const c = (best[j] ?? Infinity) + cost(S, i - j, i === N);
      if (c < (best[i] ?? Infinity)) {
        best[i] = c;
        from[i] = j;
      }
    }
  }
  const rows: number[][] = [];
  for (let i = N; i > 0; i = from[i] ?? 0) {
    const j = from[i] ?? 0;
    rows.unshift(Array.from({ length: i - j }, (_, k) => j + k));
  }
  return rows;
}
const f4 = (v: number) => String(Number(v.toFixed(4)));
// each print's drawn width at window width v (margins 40 and gap 24 from 900 px, else 32 and 16; the column at most 1180)
function widthsAt(v: number, ars: number[], rows: number[][]) {
  const m = v >= 900 ? 40 : 32;
  const g = v >= 900 ? 24 : 16;
  const W = Math.min(1180, v - 2 * m);
  const out: string[] = [];
  rows.forEach((r, j) => {
    const n = r.length;
    const S = r.reduce((a, i) => a + (ars[i] ?? 0), 0);
    const keep = j === rows.length - 1 && fillAt(S, n, W, g) >= 1;
    for (const i of r) {
      const ar = ars[i] ?? 1;
      if (W === 1180) {
        out[i] =
          `${String(Number((keep ? ((W - g) / 3.05) * ar : ((W - (n - 1) * g) * ar) / S).toFixed(2)))}px`;
      } else if (keep) {
        out[i] = `calc((100vw - ${String(2 * m + g)}px) * ${f4(ar / 3.05)})`;
      } else {
        out[i] = `calc((100vw - ${String(2 * m + (n - 1) * g)}px) * ${f4(ar / S)})`;
      }
    }
  });
  return out;
}
// sizes per print: its drawn width window by window from 1260 down to 700 px, then the column
export function printSizes(ars: number[], rows: number[][]): string[] {
  const steps: [number, string][][] = ars.map(() => []);
  const prev: string[] = [];
  for (let v = 1260; v >= 700; v--) {
    const w = widthsAt(v, ars, rows);
    ars.forEach((_, i) => {
      const s = w[i] ?? "";
      const list = steps[i];
      if (!list || s === prev[i]) {
        return;
      }
      const last = list[list.length - 1];
      if (last) {
        last[0] = v + 1;
      }
      list.push([v, s]);
      prev[i] = s;
    });
  }
  return steps.map(list => {
    const last = list[list.length - 1];
    if (last) {
      last[0] = 700;
    }
    return [
      ...list.map(([v, s]) => `(min-width: ${String(v)}px) ${s}`),
      "(min-width: 600px) calc(100vw - 64px)",
      "calc(100vw - 32px)",
    ].join(", ");
  });
}
