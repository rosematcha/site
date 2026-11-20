// The photo viewer: a modal dialog with no fill on the lit ground; the page fades out under it as under the menu. The tapped print
// flies up to the stage; Previous and Next (and the arrow keys, and a swipe on touch) step the set; a press on bare ground closes.
import type { PhotoEvent } from "../data/photos";
import type { Engine } from "../engine";
import { $$, RM } from "../engine/env";
import { later, sig } from "../engine/scope";

interface Parts {
  dlg: HTMLDialogElement;
  fly: HTMLElement;
  vobj: HTMLElement;
  img: HTMLImageElement;
  cap: HTMLElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  close: HTMLButtonElement;
  stage: HTMLElement;
}
function parts(): Parts | null {
  const dlg = document.querySelector("dialog.viewer");
  const q = <T extends Element>(s: string, t: new () => T): T | null => {
    const el = dlg?.querySelector(s);
    return el instanceof t ? el : null;
  };
  const fly = q(".v-fly", HTMLElement);
  const vobj = q(".v-obj", HTMLElement);
  const img = q(".v-img", HTMLImageElement);
  const cap = q(".v-cap", HTMLElement);
  const prev = q(".v-prev", HTMLButtonElement);
  const next = q(".v-next", HTMLButtonElement);
  const close = q(".v-close", HTMLButtonElement);
  const stage = q(".v-stage", HTMLElement);
  if (
    !(dlg instanceof HTMLDialogElement) ||
    !fly ||
    !vobj ||
    !img ||
    !cap ||
    !prev ||
    !next ||
    !close ||
    !stage
  ) {
    return null;
  }
  return { dlg, fly, vobj, img, cap, prev, next, close, stage };
}
const rectOf = (el: Element | null | undefined) => el?.getBoundingClientRect() ?? new DOMRect();
// a transform that puts the stage's photograph over rect r
function over(fly: HTMLElement, vobj: HTMLElement, r: DOMRect) {
  const t = rectOf(vobj.querySelector(".face"));
  const f = fly.getBoundingClientRect();
  const x = r.left - t.left + (t.left - f.left) * (1 - r.width / t.width);
  const y = r.top - t.top + (t.top - f.top) * (1 - r.height / t.height);
  return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(r.width / t.width).toFixed(4)}, ${(r.height / t.height).toFixed(4)})`;
}

export function initViewer(e: PhotoEvent, k: Engine) {
  const v = parts();
  if (!v) {
    return;
  }
  const { dlg, fly, vobj, img, cap, prev, next, close, stage } = v;
  const prints = $$(".print-b");
  const N = e.photos.length;
  const loaded = new Set<number>();
  const full = (i: number) => e.photos[i]?.src ?? "";
  const thumb = (i: number) => e.photos[i]?.thumbnail ?? "";
  let n = -1;
  let closing = false;
  const st = { byKey: false };
  let flying = 0;
  // keep the kit's frames running while something moves by CSS, so the photograph's cast follows it
  k.extra.add({ update: () => flying > performance.now() });
  const run = (ms: number) => {
    flying = Math.max(flying, performance.now() + ms + 40);
    k.wake();
  };
  const preload = (i: number) => {
    if (i < 0 || i >= N || loaded.has(i)) {
      return;
    }
    const im = new Image();
    im.onload = () => loaded.add(i);
    im.src = full(i);
  };
  // the photograph: within the column's width and the window less 176 px (200 on a phone), never over 1.5 times natural size
  function fit() {
    const p = e.photos[n];
    if (!p) {
      return;
    }
    const m = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--m")) || 16;
    const W = dlg.clientWidth - 2 * m;
    const H = dlg.clientHeight - (window.innerWidth < 600 ? 200 : 176);
    const s = Math.min(W / p.width, H / p.height, 1.5);
    vobj.style.setProperty("--vw", `${String(Math.floor(p.width * s))}px`);
    vobj.style.setProperty("--vh", `${String(Math.floor(p.height * s))}px`);
  }
  // the thumbnail stands in until the full file arrives
  function picture(i: number) {
    img.src = loaded.has(i) ? full(i) : thumb(i);
    if (!loaded.has(i)) {
      const im = new Image();
      im.onload = () => {
        loaded.add(i);
        if (n === i) {
          img.src = full(i);
        }
      };
      im.src = full(i);
    }
    preload(i - 1);
    preload(i + 1);
  }
  function set(i: number) {
    n = i;
    const p = e.photos[i];
    if (!p) {
      return;
    }
    img.alt = p.alt;
    img.width = p.width;
    img.height = p.height;
    picture(i);
    dlg.setAttribute("aria-label", `${e.title} ${e.year}, photo ${String(i + 1)}`);
    cap.textContent = `${e.title} ${e.year} · ${String(i + 1)} of ${String(N)}`;
    const had = document.activeElement;
    prev.disabled = i === 0;
    next.disabled = i === N - 1;
    // the pill at its end gives focus to the other
    if (had instanceof HTMLButtonElement && had.disabled) {
      (had === prev ? next : prev).focus({ preventScroll: true });
    }
    for (const pr of prints) {
      pr.classList.toggle("lifted", pr === prints[i]);
    }
    fit();
    k.relayout();
  }
  const faceOf = (i: number) => rectOf(prints[i]?.querySelector(".face"));
  const anim = (el: HTMLElement, tr: string, ms: number, ease: string, op?: number | "") => {
    el.style.transition = ms
      ? `transform ${String(ms)}ms ${ease}, opacity ${String(Math.min(ms, 220))}ms linear`
      : "none";
    el.style.transform = tr;
    if (op !== undefined) {
      el.style.opacity = String(op);
    }
    run(ms);
  };
  function open(i: number) {
    closing = false;
    const r = faceOf(i);
    dlg.showModal();
    document.documentElement.classList.add("viewer-open");
    set(i);
    close.focus({ preventScroll: true, focusVisible: st.byKey });
    anim(fly, "none", 0, "", 1);
    if (!RM()) {
      fly.style.transform = over(fly, vobj, r);
      fly.getBoundingClientRect();
      anim(fly, "none", 330, "var(--ease-lift)");
    }
  }
  // the outgoing photograph slides 24 px and fades; the next springs in from the other side
  function ghost(d: number, from: number) {
    const g = fly.cloneNode(true);
    if (!(g instanceof HTMLElement)) {
      return;
    }
    const r = fly.getBoundingClientRect();
    g.className = "v-fly v-ghost";
    g.setAttribute("aria-hidden", "true");
    g.inert = true;
    Object.assign(g.style, {
      left: `${String(r.left)}px`,
      top: `${String(r.top)}px`,
      transition: "none",
      transform: `translateX(${String(from)}px)`,
    });
    dlg.append(g);
    g.getBoundingClientRect();
    anim(g, `translateX(${String(from - d * 24)}px)`, 120, "linear", 0);
    later(() => {
      g.remove();
    }, 160);
  }
  function step(d: number, from = 0) {
    if (closing) {
      return; // an arrow during the dismissal would lift another print as the dialog closes
    }
    const i = Math.max(0, Math.min(N - 1, n + d));
    if (i === n) {
      if (from && !RM()) {
        anim(fly, "none", 330, "var(--ease-release)");
      }
      return;
    }
    if (!RM()) {
      ghost(d, from);
    }
    set(i);
    if (!RM()) {
      anim(fly, `translateX(${String(d * 24)}px)`, 0, "", 0);
      fly.getBoundingClientRect();
      anim(fly, "none", 220, "var(--ease-lift)", 1);
    }
  }
  function shut() {
    if (closing) {
      return;
    }
    closing = true;
    const pr = prints[n];
    const r = faceOf(n);
    const seen = r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
    const done = () => {
      if (!seen) {
        pr?.scrollIntoView({ block: "nearest" }); // off screen: the page moves to it while it is still hidden
      }
      dlg.close();
      for (const x of prints) {
        x.classList.remove("lifted");
      }
      document.documentElement.classList.remove("viewer-open");
      anim(fly, "none", 0, "", "");
      pr?.focus({ preventScroll: true, focusVisible: st.byKey });
      k.relayout();
    };
    if (RM()) {
      done();
    } else if (seen) {
      document.documentElement.classList.remove("viewer-open");
      anim(fly, over(fly, vobj, r), 300, "var(--ease-release)");
      later(done, 300);
    } else {
      anim(fly, "none", 140, "linear", 0);
      later(done, 140);
    }
  }
  for (const pr of prints) {
    pr.addEventListener(
      "click",
      ev => {
        st.byKey = ev.detail === 0;
        open(Number(pr.dataset.i));
      },
      sig()
    );
  }
  prev.addEventListener(
    "click",
    () => {
      step(-1);
    },
    sig()
  );
  next.addEventListener(
    "click",
    () => {
      step(1);
    },
    sig()
  );
  close.addEventListener("click", shut, sig());
  dlg.addEventListener(
    "cancel",
    ev => {
      ev.preventDefault();
      st.byKey = true;
      shut();
    },
    sig()
  );
  dlg.addEventListener(
    "keydown",
    ev => {
      if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") {
        return;
      }
      ev.preventDefault();
      st.byKey = true;
      step(ev.key === "ArrowRight" ? 1 : -1);
    },
    sig()
  );
  // a press on bare ground closes (production's click outside); a swipe that ends there doesn't
  const follow = (dx: number | null) => {
    if (dx === null) {
      anim(fly, "none", 330, "var(--ease-release)");
    } else {
      anim(fly, `translateX(${dx.toFixed(1)}px)`, 0, "");
    }
  };
  const swiped = swipes(stage, () => n, N, step, follow);
  dlg.addEventListener(
    "click",
    ev => {
      const t = ev.target instanceof Element ? ev.target : null;
      if (!swiped() && (t === dlg || t?.matches(".v-in, .v-stage, .v-bar"))) {
        st.byKey = false;
        shut();
      }
    },
    sig()
  );
  window.addEventListener(
    "resize",
    () => {
      if (dlg.open && !closing) {
        fit();
        k.relayout();
      }
    },
    sig()
  );
}
// past 64 px or a flick (0.5 px per ms) steps: 1 to the next, -1 to the previous, 0 springs back
function swipeStep(dx: number, v: number) {
  if (dx < -64 || v < -0.5) {
    return 1;
  }
  return dx > 64 || v > 0.5 ? -1 : 0;
}
// on touch, a horizontal swipe on the photograph steps the set; past 64 px or a flick steps, else it springs back. Reduced motion:
// the photograph stays put and the swap is instant. Returns whether the last press was a swipe.
function swipes(
  stage: HTMLElement,
  at: () => number,
  N: number,
  step: (d: number, from?: number) => void,
  follow: (dx: number | null) => void
) {
  let sw: {
    id: number;
    x0: number;
    y0: number;
    dx: number;
    on: boolean;
    hist: [number, number][];
  } | null = null;
  let swiped = false;
  stage.closest("dialog")?.addEventListener(
    "pointerdown",
    () => {
      swiped = false;
    },
    { ...sig(), capture: true }
  );
  stage.addEventListener(
    "pointerdown",
    ev => {
      const t = ev.target instanceof Element ? ev.target : null;
      if (ev.pointerType === "touch" && t?.closest(".v-obj")) {
        sw = {
          id: ev.pointerId,
          x0: ev.clientX,
          y0: ev.clientY,
          dx: 0,
          on: false,
          hist: [[performance.now(), ev.clientX]],
        };
      }
    },
    sig()
  );
  stage.addEventListener(
    "pointermove",
    ev => {
      if (!sw || ev.pointerId !== sw.id) {
        return;
      }
      const dx = ev.clientX - sw.x0;
      if (!sw.on) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(ev.clientY - sw.y0)) {
          return;
        }
        sw.on = true;
        stage.setPointerCapture(ev.pointerId);
      }
      const end = (dx > 0 && at() === 0) || (dx < 0 && at() === N - 1);
      sw.dx = end ? dx * 0.3 : dx;
      sw.hist.push([performance.now(), ev.clientX]);
      if (sw.hist.length > 6) {
        sw.hist.shift();
      }
      if (!RM()) {
        follow(sw.dx);
      }
    },
    sig()
  );
  const release = (ev: PointerEvent) => {
    if (!sw || ev.pointerId !== sw.id) {
      return;
    }
    const s = sw;
    sw = null;
    if (!s.on) {
      return;
    }
    swiped = true;
    const [t0, x0] = s.hist[0] ?? [performance.now(), ev.clientX];
    const v = (ev.clientX - x0) / Math.max(1, performance.now() - t0); // px per ms
    const d = ev.type === "pointercancel" ? 0 : swipeStep(s.dx, v);
    if (d) {
      step(d, RM() ? 0 : s.dx);
    } else if (!RM()) {
      follow(null);
    }
  };
  stage.addEventListener("pointerup", release, sig());
  stage.addEventListener("pointercancel", release, sig());
  return () => swiped;
}
