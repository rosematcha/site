// The page engine: the key light and grain on the ground, a cast and rim for every object, raised type, shelves, the visitor's
// lamps and the nav. It is imperative and runs beside React: a route attaches it once its markup is in the document and detaches
// it when the route leaves, which removes every listener, observer, frame and element it made. Nothing here renders through React.
import { answerArrivals } from "./arrival";
import { bakePrints } from "./bake";
import { portraits, presses, wire } from "./controls";
import { $, $$, GECKO, HS, idle, mq, num, RM, VP } from "./env";
import { extra, setFrame, stopFrames, wake, type Hook, type Shelf } from "./frame";
import { grainTile } from "./grain";
import { lightInput, type LightInput } from "./input";
import { aimKey, initKey, layoutKey, paintKey, stepKey, type Gain } from "./key";
import { initLamps, type Lamps } from "./lamps";
import { initNav } from "./nav";
import {
  fixedRect,
  measure,
  mkObj,
  mkType,
  near,
  paintObj,
  paintType,
  preblur,
  view,
  type Obj,
  type TypeEl,
} from "./objects";
import { dispose, later, psig, sig, signal, watch } from "./scope";
import { arrive, shelf, type ShelfCtl } from "./shelf";
import { stepSpring } from "./spring";
import { lineRects, onText, ownText } from "./text";
import { tiltRoom } from "./tilt";

export interface PageCfg {
  rest?: [number, number];
  gain?: Partial<Gain>;
  bake?: boolean; // Firefox draws each photograph once (bake.ts)
}
export interface Engine {
  relayout: () => void;
  adopt: (el: Element) => void;
  place: (px: number, py: number) => void;
  off: () => void;
  wake: () => void;
  extra: Set<Hook>;
}
declare global {
  interface FocusOptions {
    focusVisible?: boolean;
  }
  interface Window {
    __r10?: {
      lamps: Lamps;
      light: LightInput;
      objs: Obj[];
      texts: Element[];
      HS: () => number;
      lineRects: typeof lineRects;
    };
  }
}
const SOLID = ".tile, .obj, .portrait";

interface Page {
  objs: Obj[];
  types: TypeEl[];
  texts: Element[];
  shelves: Shelf[];
  shelfOf: (el: Element) => Shelf | null;
  lamps: Lamps;
  bake: boolean;
}
function stepObj(o: Obj, dt: number) {
  const a = stepSpring(o.lift, dt);
  const b = stepSpring(o.rx, dt);
  const c = stepSpring(o.ry, dt);
  return a || b || c;
}
function frameOf(p: Page) {
  return (dt: number) => {
    for (const o of p.objs) {
      if (o.fixed) {
        fixedRect(o); // the frame's one layout read, before it writes
      }
    }
    let more = stepKey(dt);
    paintKey();
    more = p.lamps.frame(dt) || more;
    for (const o of p.objs) {
      more = stepObj(o, dt) || more;
      view(o);
      o.vis = near(o, VP.w, VP.h);
      if (o.vis) {
        if (o.mkDue) {
          preblur(o);
        }
        paintObj(o, RM());
      }
    }
    for (const t of p.types) {
      view(t);
      if (near(t, VP.w, VP.h, 100)) {
        paintType(t);
      }
    }
    return more;
  };
}
function layoutOf(p: Page) {
  let pb = false;
  // the masks of objects far from the window are made two per idle slice
  const prebuild = () => {
    if (pb) {
      return;
    }
    pb = true;
    const s = signal();
    const step = () => {
      let n = 0;
      for (const o of p.objs) {
        if (o.mkDue && n++ < 2) {
          preblur(o);
        }
      }
      pb = !s.aborted && p.objs.some(o => o.mkDue);
      if (pb) {
        idle(step);
      }
    };
    idle(step);
  };
  return () => {
    p.texts.splice(
      0,
      p.texts.length,
      ...$$("body *").filter(el => !el.matches("script, style, template") && ownText(el))
    );
    layoutKey();
    measure(p.shelves, [...p.objs, ...p.types]);
    for (const o of p.objs) {
      o.br = null;
      o.mkDue = true;
      view(o);
      if (near(o, VP.w, VP.h, 200)) {
        preblur(o);
      }
    }
    prebuild();
    p.lamps.layout();
    wake();
  };
}
// a phone's toolbar showing or hiding changes only the height: re-lay the key, keep everything else
function onResize(relayout: () => void) {
  let rt = 0;
  let lastW = window.innerWidth;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(rt);
      rt = later(() => {
        if (window.innerWidth !== lastW || !mq("(hover: none)")) {
          lastW = window.innerWidth;
          relayout();
        } else {
          layoutKey();
          wake();
        }
      }, 60);
    },
    sig()
  );
}
// objects made after boot (a new entry): adopt(el) takes in el's [data-h] and [data-ts] (el included); an object's height follows
// its data-h (a toggle pill sits down while pressed)
function adoptions(p: Page, relayout: () => void) {
  const setH = (o: Obj) => {
    o.h = num(o.el.dataset.h);
    o.blur = 3 + 0.9 * o.h;
    o.mk = "";
    preblur(o);
    wake();
  };
  watch(
    new MutationObserver(recs => {
      for (const { target: t } of recs) {
        const o = p.objs.find(x => x.el === t);
        if (o && t instanceof HTMLElement && o.h !== num(t.dataset.h)) {
          setH(o);
        }
      }
    })
  ).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-h"] });
  return (el: Element) => {
    const has = new Set([...p.objs, ...p.types].map(x => x.el));
    const pick = (s: string) =>
      [el, ...el.querySelectorAll(s)].filter(
        (x): x is HTMLElement => x instanceof HTMLElement && x.matches(s) && !has.has(x)
      );
    for (const x of pick("[data-h]")) {
      const o = mkObj(x, p.shelfOf, p.bake);
      p.objs.push(o);
      wire(o);
    }
    p.types.push(...pick("[data-ts]").map(x => mkType(x, p.shelfOf)));
    relayout();
  };
}
function start(cfg: PageCfg): {
  page: Page;
  light: LightInput;
  ctls: ShelfCtl[];
  relayout: () => void;
} {
  document.documentElement.classList.toggle("rm", RM());
  const fx = $(".fx");
  const shelfMap = new Map<Element, Shelf>(
    $$(".shelf").map(ul => [ul, { ul, sl0: 0, give: 0, f: 0, sl: 0 }])
  );
  const shelfOf = (el: Element) => {
    const s = el.closest(".shelf");
    return s ? (shelfMap.get(s) ?? null) : null;
  };
  // Firefox, the photo pages: a photograph's key rim is drawn as borders, and each print once into a canvas (bake.ts)
  const bake = GECKO && Boolean(cfg.bake) && !mq("(prefers-contrast: more)");
  const objs = $$("[data-h]").map(el => mkObj(el, shelfOf, bake));
  const types = $$("[data-ts]").map(el => mkType(el, shelfOf));
  const shelves = [...shelfMap.values()];
  initKey($(".key"), cfg.gain ?? {});
  const lamps = initLamps({ objs, shelves, fx: fx ?? document.body, shelfOf });
  const page: Page = { objs, types, texts: [], shelves, shelfOf, lamps, bake };
  setFrame(frameOf(page));
  const relayout = layoutOf(page);
  onResize(relayout);
  window.addEventListener("scroll", wake, psig());
  objs.forEach(wire);
  presses();
  portraits(objs);
  const ctls = shelves.map(s => shelf(s, objs));
  // the visitor's light: pointer, tilt or rest drive the key; a clean tap or click on bare ground places a lamp. Plates, pictures
  // and the portrait aren't ground, and text is its lines (a tap beside a short line of the greeting places a lamp)
  let offer: ((s: "none" | "ask" | "on" | "denied") => void) | null = null;
  const light = lightInput({
    rest: cfg.rest ?? [0.4, 0.28],
    stay: 2500,
    fade: 3000,
    solid: SOLID,
    text: (x, y) => onText(page.texts, x, y),
    onHand: slots => {
      lamps.paint(slots);
      wake();
    },
    onChange: (x, y) => {
      aimKey(x, y);
    },
    onTilt: s => offer?.(s),
  });
  const ask = $(".tilt-ask");
  if (ask) {
    offer = tiltRoom(light, ask);
  }
  initNav();
  return { page, light, ctls, relayout };
}

async function boot(cfg: PageCfg): Promise<Engine | null> {
  const s = signal();
  const { page, light, ctls, relayout } = start(cfg);
  const adopt = adoptions(page, relayout);
  // the grain is made in short tasks while the rest boots; the first lit frame waits for it, so the key, the casts and the grain
  // arrive together
  const tile = await grainTile();
  if (s.aborted) {
    return null;
  }
  if (page.bake) {
    bakePrints(tile);
  }
  relayout();
  // fonts, load and the body's size: one relayout when they coincide
  let rt = 0;
  const soon = () => {
    clearTimeout(rt);
    rt = later(relayout, 30);
  };
  watch(new ResizeObserver(soon)).observe(document.body);
  void document.fonts.ready.then(() => {
    if (!s.aborted) {
      soon();
    }
  });
  // a fresh navigation to a plate's hash arrives at it (the router asks, arrival.ts); the window's load (fonts and pictures in)
  // arrives again, but only if the visitor hasn't moved the focus or the page since
  let arrived: [Element | null, number] | null = null;
  answerArrivals(() => {
    arrive(ctls);
    arrived = [document.activeElement, window.scrollY];
  });
  if (document.readyState !== "complete") {
    window.addEventListener("load", soon, sig());
    window.addEventListener(
      "load",
      () => {
        if (
          arrived &&
          arrived[0] === document.activeElement &&
          Math.abs(arrived[1] - window.scrollY) < 1
        ) {
          arrive(ctls);
        }
      },
      sig()
    );
  }
  window.__r10 = { lamps: page.lamps, light, objs: page.objs, texts: page.texts, HS, lineRects };
  return {
    relayout,
    adopt,
    place: (px, py) => {
      light.place(px, py);
    },
    off: () => {
      light.off();
    },
    wake,
    extra,
  };
}
const STATE = ["plated", "stand", "menu-open", "viewer-open", "tilt-room"];
export function attach(cfg: PageCfg) {
  const ready = boot(cfg);
  return {
    ready,
    detach() {
      answerArrivals(null);
      dispose();
      stopFrames();
      document.documentElement.classList.remove(...STATE);
      for (const el of $$(".bk, .bd")) {
        el.classList.remove("bk", "bd");
      }
      delete window.__r10;
    },
  };
}
