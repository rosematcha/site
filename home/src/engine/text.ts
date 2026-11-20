// Text by its lines: an element's lines of text as viewport rects [left, top, right, bottom], one per line (its text nodes'
// Range rects, merged where their middles share a line), each grown by pad. The blank beside a short line is not text.
import type { Rect } from "./lamps/math";

function merge(out: Rect[], q: DOMRect) {
  const mid = (q.top + q.bottom) / 2;
  const m = out.find(o => Math.abs((o[1] + o[3]) / 2 - mid) < Math.min(o[3] - o[1], q.height) / 2);
  if (!m) {
    out.push([q.left, q.top, q.right, q.bottom]);
    return;
  }
  m[0] = Math.min(m[0], q.left);
  m[1] = Math.min(m[1], q.top);
  m[2] = Math.max(m[2], q.right);
  m[3] = Math.max(m[3], q.bottom);
}
export function lineRects(el: Element, pad = 0): Rect[] {
  const out: Rect[] = [];
  const r = document.createRange();
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (!n.textContent?.trim()) {
      continue;
    }
    r.selectNodeContents(n);
    for (const q of r.getClientRects()) {
      if (q.width >= 1 && q.height >= 1) {
        merge(out, q);
      }
    }
  }
  return out.map(([a, b, c, d]) => [a - pad, b - pad, c + pad, d + pad]);
}
// px of a line's rect around its glyphs that still counts as text for a tap
const TEXT_PAD = 4;
export const ownText = (el: Element) =>
  [...el.childNodes].some(n => n.nodeType === 3 && Boolean(n.textContent?.trim()));
// is (x, y) (viewport) on a line of text? Measured when asked, so it follows any layout change
export function onText(els: Element[], x: number, y: number) {
  return els.some(el => {
    const b = el.getBoundingClientRect();
    if (
      x < b.left - TEXT_PAD ||
      x > b.right + TEXT_PAD ||
      y < b.top - TEXT_PAD ||
      y > b.bottom + TEXT_PAD
    ) {
      return false;
    }
    return lineRects(el, TEXT_PAD).some(([l, t, rt, bt]) => x >= l && x <= rt && y >= t && y <= bt);
  });
}
