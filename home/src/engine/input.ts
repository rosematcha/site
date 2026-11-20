// The page's lights, fed by every input the page allows.
// Key: mouse or pen hover > device tilt > rest. Output: onChange(x, y) as 0..1 of the viewport.
// Hand lights: a clean tap or click on bare ground places one, cycling magenta, yellow, cyan; it holds `stay` ms, then fades like
// a lamp switched off. A hand light lives in the page: it is pinned to the document point where it was placed.
import { signal } from "./scope";

type RGB = [number, number, number];
interface Warm {
  h0: number;
  d: number;
  p0: number[];
}
export interface HandLight {
  px: number;
  py: number;
  tx: number;
  ty: number;
  tau: number;
  g: number;
  g0: number | null; // 0: dark; null: lit and holding; else the gain its fade started from
  f: number; // when its fade starts (ms)
  b: number; // when it was placed (ms)
  rgb: RGB;
  hue: RGB;
  warm: Warm;
}
interface InputOptions {
  rest: [number, number];
  stay: number;
  fade: number;
  solid: string; // besides controls and [data-light=off], what isn't bare ground (plates, pictures, the portrait)
  text: (x: number, y: number) => boolean; // a line of text, which isn't ground either
  onHand: (slots: HandLight[]) => void;
  onChange: (x: number, y: number) => void;
  onTilt: (state: TiltState) => void;
}
export type TiltState = "none" | "ask" | "on" | "denied";
export interface LightInput {
  hand: HandLight[];
  readonly tilt: TiltState;
  enableTilt: () => Promise<boolean>;
  place: (px: number, py: number) => void;
  off: () => void;
  destroy: () => void;
}
export interface Down {
  x: number;
  y: number;
  t: number;
  ok: boolean;
  touch: boolean;
}
interface Tilt {
  x: number;
  y: number;
  seen: number;
  d: [number, number];
}
interface PermissionEvent {
  requestPermission?: () => Promise<string>;
}

const now = () => performance.now();
// Screen Orientation is missing before Safari 16.4
const orientation = (globalThis.screen as { orientation?: ScreenOrientation } | undefined)
  ?.orientation;
const CTRL = "a,button,input,select,textarea,label";
const HUES: RGB[] = [
  [255, 0, 255],
  [255, 255, 0],
  [0, 255, 255],
];
// while a modal dialog is open (the photo viewer) nothing places a lamp; a dialog is never ground either
const modal = () => Boolean(document.querySelector("dialog[open]"));
const unit = (v: number) => Math.min(1, Math.max(0, v));
// where a fading light's colour ends up, like a cooling filament
const EMBER: RGB = [255, 70, 20];
function hueOf([r, g, b]: RGB) {
  const M = Math.max(r, g, b);
  const d = M - Math.min(r, g, b) || 1;
  let h = 4 + (r - g) / d;
  if (M === r) {
    h = (g - b) / d;
  } else if (M === g) {
    h = 2 + (b - r) / d;
  }
  return (h * 60 + 360) % 360;
}
const pure = (h: number) =>
  [5, 3, 1].map(n => {
    const k = (n + h / 60) % 6;
    return 255 * (1 - Math.max(0, Math.min(k, 4 - k, 1)));
  });
// A fading light warms around the hue circle, not in a straight line: from cyan a straight line passes through a grey-green the
// ground already has, so the lamp would vanish mid-fade. The turn takes the side that doesn't cross green (120 degrees).
function warmTurn(c: RGB): Warm {
  const h0 = hueOf(c);
  let d = ((hueOf(EMBER) - h0 + 540) % 360) - 180;
  if (((120 - h0) * Math.sign(d) + 360) % 360 < Math.abs(d)) {
    d -= Math.sign(d) * 360;
  }
  return { h0, d, p0: pure(h0) };
}
// A clean tap: released within 10 px and 600 ms of the press, no scroll since, both ends on bare ground
export function cleanTap(d: Down, x: number, y: number, t: number, scrolled: number) {
  return d.ok && t - d.t <= 600 && scrolled <= d.t && Math.hypot(x - d.x, y - d.y) <= 10;
}

export function lightInput(o: InputOptions): LightInput {
  const DOE = (window as { DeviceOrientationEvent?: PermissionEvent }).DeviceOrientationEvent;
  const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const ac = new AbortController();
  const page = signal();
  const opt = { signal: ac.signal };
  let mouse: { x: number; y: number } | null = null;
  let tiltR: Tilt | null = null;
  const R = { x: o.rest[0], y: o.rest[1] };
  const cur = { x: R.x, y: R.y, src: "rest" };
  let rm = rmq.matches;
  let tilt: TiltState = "none";
  let n0: [number, number] | null = null;
  let tLast = 0;
  let down: Down | null = null;
  let raf = 0;
  let last = 0;
  let handT = 0;
  let tiltT = 0;
  let pin: { x: number; y: number } | null | "held" = null;
  let hue = 0;
  let hb = false;
  let scrolled = -1e9;

  const setTilt = (s: TiltState) => {
    if (s !== tilt) {
      tilt = s;
      o.onTilt(s);
    }
  };
  // A mouse on a touch-first device, or the synthetic one parked at 0,0, is not a hand: it would pin the light and outrank tilt
  const fake = (e: PointerEvent) =>
    e.pointerType === "mouse" && (coarse.matches || (!e.clientX && !e.clientY));
  // nothing wakes once the page has gone (a lamp's fade timer can fire after a navigation)
  const wake = () => {
    if (!raf && !ac.signal.aborted) {
      last = now();
      raf = requestAnimationFrame(tick);
    }
  };
  const L: HandLight[] = HUES.map(c => ({
    px: 0,
    py: 0,
    tx: 0,
    ty: 0,
    tau: 0.22,
    g: 0,
    g0: 0,
    f: 0,
    b: 0,
    rgb: [0, 0, 0],
    hue: c,
    warm: warmTurn(c),
  }));
  function put(px: number, py: number) {
    const l = L.find(x => x.g0 === 0) ?? L.reduce((a, b) => (a.b < b.b ? a : b));
    const c = HUES[hue++ % HUES.length] ?? HUES[0];
    if (!c) {
      return;
    }
    Object.assign(l, {
      px,
      py,
      tx: px,
      ty: py,
      g: 0,
      g0: null,
      f: now() + o.stay,
      b: now(),
      tau: 0.22,
      hue: c,
      rgb: [...c],
      warm: warmTurn(c),
    });
    window.setTimeout(wake, o.stay + 20);
    wake();
  }
  // the lamp is off: a fast drop, then a tail that dims and reddens (the hue turns; a hue that isn't fully saturated keeps its offset)
  function fadeStep(l: HandLight, t: number) {
    l.g0 ??= l.g;
    const u = t - l.f;
    const tail = Math.max(0, 1 - u / o.fade) ** 2;
    if (tail) {
      l.g = l.g0 * (0.5 * Math.exp(-u / 90) + 0.5 * tail);
    } else {
      l.g0 = 0;
      l.g = l.g0;
    }
    const w = l.warm;
    const p = pure(w.h0 + w.d * (1 - tail));
    l.rgb = l.hue.map((c, i) =>
      Math.round(Math.min(255, Math.max(0, c + (p[i] ?? 0) - (w.p0[i] ?? 0))))
    ) as RGB;
  }
  function riseStep(l: HandLight, dt: number) {
    const E = (tau: number) => (rm ? 1 : 1 - Math.exp(-dt / tau));
    const d =
      Math.abs(l.tx - l.px) / window.innerWidth +
      Math.abs(l.ty - l.py) / window.innerHeight +
      1 -
      l.g;
    const a = E(l.tau);
    l.px += (l.tx - l.px) * a;
    l.py += (l.ty - l.py) * a;
    l.g += (1 - l.g) * E(0.09);
    return d > 1e-3;
  }
  function handTick(t: number, dt: number) {
    let busy = false;
    for (const l of L) {
      if (l.g0 === 0) {
        continue;
      }
      if (t >= l.f) {
        fadeStep(l, t);
        busy = true;
      } else {
        busy = riseStep(l, dt) || busy;
      }
    }
    if (busy || hb) {
      o.onHand(L);
    }
    hb = busy;
    return busy;
  }
  function pick(t: number): [string, { x: number; y: number }, number] {
    if (mouse) {
      return ["pointer", mouse, 0.08];
    }
    if (tiltR && t - tiltR.seen < 800) {
      return ["tilt", tiltR, 0.12];
    }
    return ["rest", R, 0.5];
  }
  function tick(t: number) {
    const dt = Math.min(64, t - last) / 1000;
    last = t;
    const [s, p, tau0] = pick(t);
    if (s !== cur.src) {
      cur.src = s;
      handT = t;
    }
    // glide on handover, never snap
    let tau = t - handT < 500 ? Math.max(tau0, 0.3) : tau0;
    if (rm) {
      tau = 0.1;
    }
    const k = 1 - Math.exp(-dt / tau);
    const dx = (p.x - cur.x) * k;
    const dy = (p.y - cur.y) * k;
    cur.x += dx;
    cur.y += dy;
    o.onChange(cur.x, cur.y);
    const hands = handTick(t, dt);
    const more = hands || Math.abs(dx) + Math.abs(dy) > 1e-4 || t - handT < 500;
    raf = more ? requestAnimationFrame(tick) : 0;
  }

  // Mouse and pen: the light is the pointer while it is over the page. A press leaves the key behind; it takes up the pointer
  // again once the pointer is 24 px from the release.
  function onMove(e: PointerEvent) {
    if (down?.ok && e.isPrimary && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) {
      down.ok = false;
    }
    if (!e.isPrimary || rm || e.pointerType === "touch" || fake(e)) {
      return;
    }
    if (pin) {
      if (pin === "held" || Math.hypot(e.clientX - pin.x, e.clientY - pin.y) < 24) {
        return;
      }
      pin = null;
      handT = now();
    }
    mouse = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    wake();
  }
  const notGround = `${CTRL},dialog,[data-light=off],${o.solid}`;
  const free = (el: Element | null, x: number, y: number) =>
    el !== null && !el.closest(notGround) && !o.text(x, y);
  // a press only arms a light; it lands on release if the press was clean. A press that stops a scroll (the page's, a shelf's,
  // a fling's) is a catch, not a tap
  function onDown(e: PointerEvent) {
    if (!e.isPrimary) {
      return;
    }
    if (modal()) {
      down = null;
      return;
    }
    if (fake(e)) {
      return;
    }
    const touch = e.pointerType === "touch";
    if (!touch) {
      pin = "held";
    }
    const el = e.target instanceof Element ? e.target : null;
    down = {
      x: e.clientX,
      y: e.clientY,
      t: now(),
      ok: free(el, e.clientX, e.clientY) && now() - scrolled > 120,
      touch,
    };
  }
  // a synthetic release (the shelf's own landing, a test) names its target; a real one is checked where it ends
  function endTarget(e: PointerEvent) {
    if (e.isTrusted) {
      return document.elementFromPoint(e.clientX, e.clientY);
    }
    return e.target instanceof Element ? e.target : document.body;
  }
  function onUp(e: PointerEvent) {
    if (!e.isPrimary) {
      return;
    }
    const d = down;
    down = null;
    if (pin) {
      pin = { x: e.clientX, y: e.clientY };
    }
    if (
      !d ||
      modal() ||
      e.type !== "pointerup" ||
      !cleanTap(d, e.clientX, e.clientY, now(), scrolled)
    ) {
      return;
    }
    if (free(endTarget(e), e.clientX, e.clientY)) {
      put(d.x + window.scrollX, d.y + window.scrollY);
    }
  }
  document.addEventListener("pointermove", onMove, opt);
  document.documentElement.addEventListener(
    "pointerleave",
    e => {
      if (e.pointerType !== "touch") {
        mouse = null;
        wake();
      }
    },
    opt
  );
  document.addEventListener("pointerdown", onDown, opt);
  document.addEventListener("pointerup", onUp, opt);
  document.addEventListener("pointercancel", onUp, opt);
  // the page's and every shelf's scroll
  document.addEventListener(
    "scroll",
    () => {
      scrolled = now();
    },
    { ...opt, capture: true, passive: true }
  );

  // Tilt: neutral is the first reading, then slowly follows the hand, so any posture is "level"
  const dz = (d: number) => (Math.abs(d) < 1 ? 0 : d - Math.sign(d)); // 1 degree dead zone for hand tremor
  function axes(e: DeviceOrientationEvent): [number, number] {
    const a = orientation?.angle ?? 0;
    const g = e.gamma ?? 0;
    const b = e.beta ?? 0;
    if (a === 90) {
      return [b, -g];
    }
    return a === 270 ? [-b, g] : [g, b]; // landscape swaps the axes
  }
  function orient(e: DeviceOrientationEvent) {
    if (e.beta === null || rm) {
      return;
    }
    const r = axes(e);
    const t = e.timeStamp;
    const base = !n0 || t - tLast > 1000 ? r : n0;
    const k = 1 - Math.exp(-(t - tLast) / 6000);
    n0 = [base[0] + (r[0] - base[0]) * k, base[1] + (r[1] - base[1]) * k];
    tLast = t;
    const d: [number, number] = [dz(r[0] - n0[0]), dz(r[1] - n0[1])];
    const seen = now();
    // once readings stop, wake once more so the key goes back to rest
    clearTimeout(tiltT);
    tiltT = window.setTimeout(wake, 850);
    // Android sends readings without asking, and sensor noise never stops: only a change past 0.4 degrees wakes the loop
    if (
      tiltR &&
      tilt === "on" &&
      Math.abs(d[0] - tiltR.d[0]) <= 0.4 &&
      Math.abs(d[1] - tiltR.d[1]) <= 0.4
    ) {
      tiltR.seen = seen;
      return;
    }
    tiltR = { x: unit(R.x + d[0] / 18 / 2), y: unit(R.y + d[1] / 18 / 2), seen, d };
    setTilt("on");
    wake();
  }
  if (DOE) {
    window.addEventListener("deviceorientation", orient, opt);
    if (DOE.requestPermission) {
      // iOS: offer only after a touch
      window.setTimeout(() => {
        if (tilt === "none" && !ac.signal.aborted) {
          setTilt("ask");
        }
      }, 900);
    }
  }
  orientation?.addEventListener(
    "change",
    () => {
      n0 = null;
    },
    opt
  );
  rmq.addEventListener(
    "change",
    e => {
      rm = e.matches;
      mouse = null;
      tiltR = null;
      wake();
    },
    opt
  );
  const destroy = () => {
    ac.abort();
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(tiltT);
  };
  page.addEventListener("abort", destroy);
  wake();

  return {
    hand: L,
    get tilt() {
      return tilt;
    },
    // Call from a click or touchend handler: iOS only shows its prompt during a user gesture
    async enableTilt() {
      if (!DOE?.requestPermission) {
        return tilt === "on";
      }
      const r = await DOE.requestPermission().catch(() => "denied");
      if (r !== "prompt") {
        setTilt(r === "granted" ? "on" : "denied");
      }
      return r === "granted";
    },
    // the page's own lamps: one placed at a document point in the next free slot, held, then fading like any lamp
    place(px, py) {
      put(px, py);
    },
    // every lit lamp starts its normal switch-off now (content moved under it)
    off() {
      const t = now();
      for (const l of L) {
        if (l.g0 !== 0 && l.f > t) {
          l.f = t;
        }
      }
      wake();
    },
    destroy,
  };
}
