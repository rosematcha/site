// The text the lamps hold their light back near: every text block, collected again on every layout (text a page adds after boot,
// a signed entry, is held back like the rest). A well (.field) is text too: its placeholder sits on the ground seen through the
// well's fill, so the whole well is held back as one line in the placeholder's colour.
import { $$ } from "../env";
import type { Shelf } from "../frame";
import { lineRects } from "../text";

import { YB } from "./combine";
import { Y, type Rect } from "./math";
import { P, type Block } from "./types";

const TEXT = "h1, h2, h3, .t, p, li, dt, dd, .tl, .field, .label, .where, .row-nav a, .wordmark";
interface Ink {
  color: string;
  fontSize: string;
  fontWeight: string;
}
// the luminance the ground may reach under this text and keep it at 4.5 (3 for display), with a margin for the grain
function textCap(el: Element, cs: Ink) {
  const scale = /^color\(/.test(cs.color) ? 255 : 1; // color(srgb r g b) is in 0..1
  const [r = 0, g = 0, b = 0] = (cs.color.match(/[\d.]+/g) ?? []).map(v => Number(v) * scale);
  const fs = parseFloat(cs.fontSize);
  const big =
    /^H[12]$/.test(el.tagName) || fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700);
  return (Y(r, g, b) + 0.05) / (big ? 3 : 4.5) - 0.05 - P.add.margin;
}
// dark text (a pressed toggle's label on its light face) doesn't sit on the ground: it holds nothing back
function capOfText(el: Element, cs: Ink) {
  const c = textCap(el, cs);
  return c > YB ? c : P.add.open;
}
type ShelfOf = (el: Element) => Shelf | null;
function mkBlock(el: HTMLElement, shelfOf: ShelfOf): Block {
  const cs = getComputedStyle(el);
  const well = el.matches(".field");
  const ink = well
    ? {
        color: getComputedStyle(el, "::placeholder").color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      }
    : cs;
  return {
    el,
    well,
    r: null,
    lines: [],
    shelf: shelfOf(el),
    fixed: Boolean(el.closest(".bars-btn")),
    cap: capOfText(el, ink),
    sl: 0,
  };
}
export function collectBlocks(old: Block[], shelfOf: ShelfOf): Block[] {
  const had = new Map(old.map(b => [b.el, b]));
  return $$(TEXT)
    .filter(el => !el.closest(".menu") && !el.querySelector(TEXT))
    .map(el => {
      const b = had.get(el);
      if (!b) {
        return mkBlock(el, shelfOf);
      }
      if (!b.well) {
        b.cap = capOfText(el, getComputedStyle(el)); // a colour that changed with state (a toggle pressed since)
      }
      return b;
    });
}
// measures every block's lines in page px; returns the fixed blocks that hold light back (laid over each map's kept field)
export function measureBlocks(blocks: Block[]) {
  for (const b of blocks) {
    const R = b.el.getBoundingClientRect();
    const sx = b.fixed ? 0 : window.scrollX;
    const sy = b.fixed ? 0 : window.scrollY;
    b.r = [R.left + sx, R.top + sy, R.right + sx, R.bottom + sy];
    const lines: Rect[] = b.well ? [[R.left, R.top, R.right, R.bottom]] : lineRects(b.el);
    b.lines = lines.map(q => [q[0] + sx, q[1] + sy, q[2] + sx, q[3] + sy]);
    b.sl = b.shelf ? b.shelf.ul.scrollLeft - b.shelf.give : 0; // a shelf's travel since
  }
  return blocks.filter(b => b.fixed && b.cap < P.add.open);
}
