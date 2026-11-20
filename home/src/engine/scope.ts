// One page's life: every listener, observer, timer and element the engine makes while a route is shown, undone when it leaves.
let ac = new AbortController();
let offs: (() => void)[] = [];

export const sig = (): AddEventListenerOptions => ({ signal: ac.signal });
export const psig = (): AddEventListenerOptions => ({ signal: ac.signal, passive: true });
export const signal = () => ac.signal;
function onDispose(f: () => void) {
  offs.push(f);
}
// a timeout that does nothing once its page has gone
export function later(f: () => void, ms = 0) {
  const s = ac.signal;
  return window.setTimeout(() => {
    if (!s.aborted) {
      f();
    }
  }, ms);
}
export function watch<T extends { disconnect: () => void }>(o: T): T {
  onDispose(() => {
    o.disconnect();
  });
  return o;
}
// an element the engine adds to the page (removed when the page goes)
export function made<T extends Element>(el: T): T {
  onDispose(() => {
    el.remove();
  });
  return el;
}
export function mk<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls: string,
  parent?: Element
): HTMLElementTagNameMap[K] {
  const e = made(document.createElement(tag));
  e.className = cls;
  e.setAttribute("aria-hidden", "true");
  parent?.append(e);
  return e;
}
export function dispose() {
  ac.abort();
  const fs = offs;
  offs = [];
  ac = new AbortController();
  for (const f of fs.reverse()) {
    f();
  }
}
