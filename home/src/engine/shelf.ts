// A shelf (v12's): touch and trackpads scroll it natively and snap; a mouse drag past 6 px tracks 1:1, coasts on the pointer's
// velocity (325 ms time constant) and settles on the nearest stop on a spring; past either end it gives 0.3, at most 60 px,
// through `left` (never a transform). A focused plate comes to the column edge; Left and Right step plates; a press on bare
// shelf ground that never became a drag still lands a lamp.
import { $$, clamp, RM } from "./env";
import { extra, wake, type Hook, type Shelf } from "./frame";
import type { Obj } from "./objects";
import { psig, sig } from "./scope";
import { spring, stepSpring } from "./spring";

const COAST = 0.325;
const GIVE = 0.3;
const GIVE_MAX = 60;
interface Grab {
  id: number;
  x0: number;
  y0: number;
  p0: number;
  moved: boolean;
  t: Element;
  track: [number, number][];
}
export interface ShelfCtl {
  ul: HTMLElement;
  toStop: (st: Element) => void;
}
const land = (t: Element, x: number, y: number, type: string) => {
  for (const k of ["pointerdown", "pointerup"]) {
    t.dispatchEvent(
      new PointerEvent(k, {
        bubbles: true,
        isPrimary: true,
        pointerType: type,
        clientX: x,
        clientY: y,
      })
    );
  }
};
const px = (v: string) => parseFloat(v) || 0;
const nearestSnap = (snaps: number[], x: number) =>
  snaps.reduce((a, s) => (Math.abs(s - x) < Math.abs(a - x) ? s : a), snaps[0] ?? 0);
// a release's throw from the last 100 ms of the pointer's track (a pointer that stopped before letting go throws nothing)
function throwOf(track: [number, number][], t: number) {
  const [t0, x0] = track[0] ?? [t, 0];
  const [t1, x1] = track[track.length - 1] ?? [t, 0];
  const dt = (t1 - t0) / 1000;
  return dt > 0.008 && t - t1 < 80 ? -(x1 - x0) / dt : 0;
}

export function shelf(s: Shelf, objs: Obj[]): ShelfCtl {
  const { ul } = s;
  const stops = $$("[data-stop]", ul);
  const own = objs.filter(o => ul.contains(o.el));
  const S = spring(0, 5.5, 0.8, 0.5);
  let max = 0;
  let snaps = [0];
  let p = 0;
  let v = 0;
  let mode: "" | "coast" | "settle" = "";
  let g: Grab | null = null;
  let eat = -1e9;
  const pad = () => {
    const cs = getComputedStyle(ul);
    return px(cs.scrollPaddingLeft) || px(cs.paddingLeft);
  };
  const on = () => ul.scrollWidth > ul.clientWidth + 1;
  // the end is the last stop's right edge plus the padding, not scrollWidth: casts and lifted faces reach past the plates and
  // count as scrollable overflow, which would put the spring's target a few px off the CSS snap
  const measure = () => {
    const r0 = ul.getBoundingClientRect().left - ul.scrollLeft; // the give moves the list and its stops alike
    const o = pad();
    const end =
      (stops[stops.length - 1]?.getBoundingClientRect().right ?? 0) -
      r0 +
      px(getComputedStyle(ul).paddingRight);
    max = Math.max(0, Math.min(ul.scrollWidth - ul.clientWidth, Math.round(end - ul.clientWidth)));
    snaps = [
      ...new Set(
        stops.map(el => clamp(Math.round(el.getBoundingClientRect().left - r0 - o), 0, max))
      ),
    ];
  };
  function show() {
    const c = clamp(p, 0, max);
    const o = p - c;
    const give = RM() ? 0 : -Math.sign(o) * Math.min(GIVE_MAX, GIVE * Math.abs(o));
    ul.scrollLeft = c;
    s.give = give;
    ul.style.left = give ? `${give.toFixed(1)}px` : "";
    wake();
  }
  const stop = () => {
    mode = "";
    ul.classList.remove("held");
    s.give = 0;
    ul.style.left = "";
    extra.delete(run);
  };
  const settleTo = () => {
    if (p < 0) {
      return 0;
    }
    return p > max ? max : nearestSnap(snaps, p + v * COAST);
  };
  const run: Hook = {
    update(dt) {
      if (mode === "coast") {
        v *= Math.exp(-dt / COAST);
        p += v * dt;
        if (p < 0 || p > max || Math.abs(v) < 120) {
          measure();
          mode = "settle";
          Object.assign(S, { x: p, v, t: settleTo() });
        }
      } else if (mode === "settle" && !stepSpring(S, dt)) {
        mode = "";
      }
      if (mode !== "coast") {
        p = S.x;
      }
      show();
      if (!mode) {
        stop();
      }
      return Boolean(mode);
    },
  };
  // while held the plates stand 4 px higher
  const lift = (h?: number) => {
    if (!RM()) {
      for (const o of own) {
        o.lift.t = h ?? (o.tile?.matches(":hover") ? 10 : 0);
      }
    }
    wake();
  };
  function grab(e: PointerEvent, G: Grab) {
    G.moved = true;
    ul.setPointerCapture(e.pointerId);
    ul.classList.add("held", "grabbing");
    getSelection()?.removeAllRanges();
    lift(4);
  }
  // bring a stop to the column edge at once
  const toStop = (st: Element) => {
    measure();
    stop();
    const r0 = ul.getBoundingClientRect().left - ul.scrollLeft;
    p = clamp(st.getBoundingClientRect().left - r0 - pad(), 0, max);
    show();
  };
  ul.addEventListener(
    "pointerdown",
    e => {
      if (
        !e.isTrusted ||
        e.pointerType === "touch" ||
        e.button ||
        !on() ||
        !(e.target instanceof Element)
      ) {
        return;
      }
      measure();
      const caught = Boolean(mode); // a press on a moving shelf catches it, and its click follows nothing
      mode = "";
      extra.delete(run);
      if (!caught) {
        p = ul.scrollLeft;
      }
      g = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        p0: p,
        moved: false,
        t: e.target,
        track: [[e.timeStamp, e.clientX]],
      };
      if (caught) {
        grab(e, g);
      }
      ul.dataset.light = "off"; // no lamp until the press is known not to be a drag
    },
    sig()
  );
  ul.addEventListener(
    "pointermove",
    e => {
      if (!g || e.pointerId !== g.id) {
        return;
      }
      const dx = e.clientX - g.x0;
      if (!g.moved) {
        if (Math.hypot(dx, e.clientY - g.y0) <= 6) {
          return;
        }
        grab(e, g);
      }
      p = RM() ? clamp(g.p0 - dx, 0, max) : g.p0 - dx;
      show();
      g.track.push([e.timeStamp, e.clientX]);
      while (g.track.length > 2 && e.timeStamp - (g.track[0]?.[0] ?? 0) > 100) {
        g.track.shift();
      }
    },
    sig()
  );
  const up = (e: PointerEvent) => {
    if (!g || e.pointerId !== g.id) {
      return;
    }
    const G = g;
    g = null;
    delete ul.dataset.light;
    if (!G.moved) {
      if (e.type === "pointerup" && !G.t.closest("a, button")) {
        land(G.t, e.clientX, e.clientY, e.pointerType);
      }
      return;
    }
    ul.classList.remove("grabbing");
    lift();
    eat = e.timeStamp;
    v = throwOf(G.track, e.timeStamp);
    if (RM()) {
      // reduced motion: snaps at once
      p = clamp(nearestSnap(snaps, clamp(p, 0, max)), 0, max);
      show();
      stop();
      return;
    }
    mode = "coast";
    extra.add(run);
    wake();
  };
  ul.addEventListener("pointerup", up, sig());
  ul.addEventListener("pointercancel", up, sig());
  ul.addEventListener(
    "click",
    e => {
      if (e.timeStamp - eat < 500) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { ...sig(), capture: true }
  );
  ul.addEventListener(
    "dragstart",
    e => {
      e.preventDefault();
    },
    sig()
  );
  ul.addEventListener(
    "selectstart",
    e => {
      if (g) {
        e.preventDefault();
      }
    },
    sig()
  );
  ul.addEventListener(
    "wheel",
    () => {
      if (mode && !g) {
        stop();
      }
    },
    psig()
  );
  // keyboard: a focused stop comes to the column edge; Left and Right move between this shelf's stops
  ul.addEventListener(
    "focusin",
    e => {
      const t = e.target instanceof Element ? e.target : null;
      const st = t?.closest("[data-stop]");
      if (st && on() && t?.matches(":focus-visible")) {
        toStop(st);
      }
    },
    sig()
  );
  ul.addEventListener(
    "keydown",
    e => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
        return;
      }
      const i = stops.findIndex(st => e.target instanceof Node && st.contains(e.target));
      if (i < 0) {
        return;
      }
      e.preventDefault();
      const to = stops[clamp(i + (e.key === "ArrowRight" ? 1 : -1), 0, stops.length - 1)];
      const f = to?.matches("a, button") ? to : to?.querySelector<HTMLElement>("a, button");
      f?.focus({ preventScroll: true }); // the focusin handler brings it to the column edge
    },
    sig()
  );
  ul.addEventListener("scroll", wake, psig());
  return { ul, toStop };
}

// Arriving at #<id> of a plate in a shelf (/work#client-ruby-city, /photos#event-<id>): its stop goes to the column edge and its
// shelf's heading to the scroll padding (76 px), without smoothing; focus moves to the plate without a ring.
function hashTarget() {
  try {
    const id = decodeURIComponent(location.hash.slice(1));
    return id ? document.getElementById(id) : null;
  } catch {
    return null;
  }
}
// the shelf's heading (its aria-labelledby), or the shelf
function headOf(st: Element) {
  const ul = st.closest(".shelf");
  const lab = ul?.getAttribute("aria-labelledby")?.split(" ")[0];
  return (lab ? document.getElementById(lab) : null) ?? ul;
}
// focusVisible: false is honoured only by some engines, and Chromium shows a ring for script focus before any input, so the
// plate is marked quiet (no ring, no lift) until it loses focus or a key is pressed
function quietFocus(f: HTMLElement) {
  f.dataset.quiet = "";
  const done = () => {
    delete f.dataset.quiet;
    f.removeEventListener("blur", done);
    window.removeEventListener("keydown", done, true);
  };
  f.addEventListener("blur", done);
  window.addEventListener("keydown", done, true);
  f.focus({ preventScroll: true, focusVisible: false });
}
export function arrive(shelves: ShelfCtl[]) {
  const el = hashTarget();
  const st = el?.closest(".shelf [data-stop]");
  if (!el || !st) {
    return;
  }
  shelves.find(x => x.ul.contains(st))?.toStop(st);
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const top = (headOf(st)?.getBoundingClientRect().top ?? 0) + window.scrollY - pad;
  window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  // the plate takes focus only if nothing has it: a visitor who has already moved focus (Skip, a tab) keeps it
  const free = !document.activeElement || document.activeElement === document.body;
  if (free) {
    quietFocus(el.matches("a, button") ? el : (st.querySelector<HTMLElement>("a, button") ?? el));
  }
}
