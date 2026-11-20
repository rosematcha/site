// The objects' hands-on parts: tiles that rise and lean toward the pointer, pills that sink on a press, and the portrait that
// shows its next print on a press.
import { $$, clamp, idle, RM } from "./env";
import { wake } from "./frame";
import { fixedRect, view, type Obj } from "./objects";
import { sig } from "./scope";

const LIFT = 10;
const TILT = 3;
// tiles rise and lean toward the pointer (a Balatro-like spring); a press sinks on touch. The tile's box comes from the page
// geometry measure() keeps (no layout read per pointermove)
export function wire(o: Obj) {
  const tile = o.el.closest<HTMLElement>(".tile");
  if (!tile) {
    return;
  }
  const aim = (e: PointerEvent) => {
    if (RM()) {
      return;
    }
    if (o.fixed) {
      fixedRect(o);
    } else {
      view(o);
    }
    if (!o.w) {
      return;
    }
    const l = o.vx - o.w / 2;
    const t = o.vy - o.hh / 2;
    o.ry.t = clamp(((e.clientX - l) / o.w) * 2 - 1, -1, 1) * TILT;
    o.rx.t = -clamp(((e.clientY - t) / o.hh) * 2 - 1, -1, 1) * TILT;
    wake();
  };
  const rest = () => {
    o.lift.t = 0;
    o.rx.t = 0;
    o.ry.t = 0;
    wake();
  };
  const mouse = (e: PointerEvent) =>
    e.pointerType === "mouse" && !o.shelf?.ul.classList.contains("grabbing");
  tile.addEventListener(
    "pointerenter",
    e => {
      if (mouse(e)) {
        o.lift.t = LIFT;
        aim(e);
      }
    },
    sig()
  );
  tile.addEventListener(
    "pointermove",
    e => {
      if (mouse(e)) {
        aim(e);
      }
    },
    sig()
  );
  tile.addEventListener("pointerleave", rest, sig());
  tile.addEventListener("pointercancel", rest, sig());
  tile.addEventListener(
    "pointerdown",
    e => {
      if (e.pointerType !== "mouse") {
        o.lift.t = LIFT * 0.6;
        wake();
      }
    },
    sig()
  );
  tile.addEventListener(
    "pointerup",
    e => {
      if (e.pointerType !== "mouse") {
        rest();
      }
    },
    sig()
  );
  tile.addEventListener(
    "focus",
    () => {
      if (tile.matches(":focus-visible") && !tile.hasAttribute("data-quiet")) {
        o.lift.t = LIFT;
        wake();
      }
    },
    sig()
  );
  tile.addEventListener("blur", rest, sig());
  o.tile = tile;
}
// buttons sink on press and pop on release (CSS)
export function presses() {
  for (const b of $$(".btn")) {
    const down = () => {
      b.classList.add("down");
    };
    const up = () => {
      b.classList.remove("down");
    };
    b.addEventListener("pointerdown", down, sig());
    for (const ev of ["pointerup", "pointerleave", "pointercancel", "blur", "keyup"]) {
      b.addEventListener(ev, up, sig());
    }
    b.addEventListener(
      "keydown",
      e => {
        if (e.key === "Enter" || e.key === " ") {
          down();
        }
      },
      sig()
    );
  }
}
// The portrait: one photo at a time; a press hops the print and the next one comes up. A print that isn't showing has no file yet
// (data-src); the others load at low priority once the page has loaded and the main thread is idle. A press before then waits for
// the next print to decode; the one showing stays meanwhile.
const ready = new WeakMap<Element, Promise<void>>();
const done = new WeakSet<Element>();
function fill(pr: Element) {
  const had = ready.get(pr);
  if (had) {
    return had;
  }
  const p = Promise.all(
    $$<HTMLImageElement>("img", pr).map(im => {
      const { src, srcset } = im.dataset;
      if (src) {
        if (srcset) {
          im.srcset = srcset;
        }
        im.src = src;
        delete im.dataset.srcset;
        delete im.dataset.src;
      }
      return im.decode().catch(() => undefined);
    })
  ).then(() => {
    done.add(pr);
  });
  ready.set(pr, p);
  return p;
}
export function portraits(objs: Obj[]) {
  for (const btn of $$(".portrait")) {
    const prints = $$(".print", btn);
    const o = objs.find(x => btn.contains(x.el));
    let i = Math.max(
      0,
      prints.findIndex(p => p.classList.contains("on"))
    );
    let wait = false;
    const soon = () => {
      idle(() => {
        for (const p of prints) {
          void fill(p);
        }
      }, 2000);
    };
    if (document.readyState === "complete") {
      soon();
    } else {
      window.addEventListener("load", soon, { ...sig(), once: true });
    }
    const swap = (n: number) => {
      prints[i]?.classList.remove("on");
      i = n;
      prints[i]?.classList.add("on");
      prints.forEach((p, j) => {
        const img = p.querySelector("img");
        if (img) {
          img.alt = j === i ? (p.dataset.alt ?? "") : "";
        }
      });
      if (!RM() && o) {
        o.lift.v += 260;
        o.ry.v += 40;
        wake();
      }
    };
    btn.addEventListener(
      "click",
      () => {
        const n = (i + 1) % prints.length;
        const next = prints[n];
        if (!next || done.has(next)) {
          swap(n);
          return;
        }
        if (wait) {
          return;
        }
        wait = true;
        void fill(next).then(() => {
          wait = false;
          swap(n);
        });
      },
      sig()
    );
  }
}
