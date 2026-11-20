// Firefox, the photo pages: Gecko paints a print's three blended channel layers and its grain again on every scrolled frame
// (p-set at 1024, three lamps: 69% of frames over 34 ms). There each print is drawn once into one canvas in device px with the
// CSS's arithmetic: each channel covers the box scaled about its centre by 1 + 2k (red), 1 + k (green) and 1 (blue), the channels
// added on black, the grain tile at half opacity over them. Redrawn when its box or its file changes; one per idle slice. The red
// channel's image stays in place, unseen, for its alt.
import { $$, idle } from "./env";
import { made, signal, watch } from "./scope";

export interface Print {
  ca: HTMLElement;
  img: HTMLImageElement;
  size: [number, number];
  baked: string;
}
// each channel's scale step (red 2, green 1, blue 0); its colour is its layer's in kit.css (.ca .r::after and so on)
const CH = [2, 1, 0];
let tint: string[] = [];
const tintsOf = (ca: Element) =>
  [".r", ".g", ".b"].map(c => {
    const ch = ca.querySelector(`.ch${c}`);
    return ch ? getComputedStyle(ch, "::after").backgroundColor : "";
  });
function channels(
  ctx: CanvasRenderingContext2D,
  tmp: HTMLCanvasElement,
  bms: ImageBitmap[],
  W: number,
  H: number,
  place: (f: number) => [number, number],
  k: number
) {
  const y = tmp.getContext("2d");
  if (!y) {
    return;
  }
  CH.forEach((m, i) => {
    const bm = bms[i];
    if (!bm) {
      return;
    }
    const [x0, y0] = place(1 + m * k);
    y.globalCompositeOperation = "source-over";
    y.drawImage(bm, x0, y0);
    y.globalCompositeOperation = "multiply";
    y.fillStyle = tint[i] ?? "";
    y.fillRect(0, 0, W, H);
    ctx.drawImage(tmp, 0, 0);
    bm.close();
  });
}
interface Plan {
  W: number;
  H: number;
  k: number;
  ox: number;
  oy: number;
  sig: string;
}
// what a print needs drawn now, or null (not loaded, no box, or already drawn so)
function planOf(p: Print): Plan | null {
  const { ca, img } = p;
  const d = window.devicePixelRatio;
  const W = Math.round(p.size[0] * d);
  const H = Math.round(p.size[1] * d);
  const sig = `${String(W)} ${String(H)} ${img.currentSrc}`;
  if (!img.complete || !img.naturalWidth || !W || !H || p.baked === sig) {
    return null; // a load or a resize queues it again
  }
  const k = parseFloat(getComputedStyle(ca).getPropertyValue("--k")) || 0.006;
  const [ox = 0.5, oy = 0.5] = getComputedStyle(img)
    .objectPosition.split(" ")
    .map(v => parseFloat(v) / 100);
  return { W, H, k, ox, oy, sig };
}
function draw(
  p: Print,
  a: Plan,
  bms: ImageBitmap[],
  drawn: [number, number],
  tile: HTMLCanvasElement,
  tmp: HTMLCanvasElement
) {
  const { W, H } = a;
  const cv =
    p.ca.querySelector<HTMLCanvasElement>(":scope > canvas") ??
    made(p.ca.appendChild(document.createElement("canvas")));
  cv.width = W;
  cv.height = H;
  tmp.width = W;
  tmp.height = H;
  const x = cv.getContext("2d");
  if (!x) {
    return;
  }
  const dx = (W - drawn[0]) * a.ox;
  const dy = (H - drawn[1]) * a.oy;
  x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "lighter";
  channels(
    x,
    tmp,
    bms,
    W,
    H,
    f => [Math.round(W / 2 + (dx - W / 2) * f), Math.round(H / 2 + (dy - H / 2) * f)],
    a.k
  );
  const g = x.createPattern(tile, "repeat");
  if (g) {
    g.setTransform(new DOMMatrix().scale((window.devicePixelRatio * 192) / tile.width));
    Object.assign(x, { globalCompositeOperation: "source-over", globalAlpha: 0.5, fillStyle: g });
    x.fillRect(0, 0, W, H);
  }
  p.baked = a.sig;
  p.ca.classList.add("bk");
}
// one print, drawn unless its page has gone meanwhile (then any bitmap made since is closed and nothing is drawn)
export async function bake(
  p: Print,
  tile: HTMLCanvasElement,
  tmp: HTMLCanvasElement,
  page: AbortSignal
) {
  if (!tint.length) {
    tint = tintsOf(p.ca);
  }
  const gone = () => page.aborted; // read after each await
  const a = planOf(p);
  const full = a ? await createImageBitmap(p.img).catch(() => null) : null;
  if (!a || !full || gone()) {
    full?.close();
    return;
  }
  // each channel made at its drawn size and placed on whole px: a fine filter when the file is shrunk (Gecko's decoder shrinks the
  // element so), bilinear when it is enlarged
  const s = Math.max(a.W / full.width, a.H / full.height);
  const resizeQuality: ResizeQuality = s < 1 ? "high" : "low";
  const settled = await Promise.allSettled(
    CH.map(m =>
      createImageBitmap(full, {
        resizeWidth: Math.round(full.width * s * (1 + m * a.k)),
        resizeHeight: Math.round(full.height * s * (1 + m * a.k)),
        resizeQuality,
      })
    )
  );
  const bms = settled.flatMap(r => (r.status === "fulfilled" ? [r.value] : []));
  const drawn: [number, number] = [full.width * s, full.height * s];
  full.close();
  // a channel that failed, or a page gone meanwhile: every bitmap that was made is closed and nothing is drawn
  if (gone() || bms.length < CH.length) {
    for (const bm of bms) {
      bm.close();
    }
    return;
  }
  draw(p, a, bms, drawn, tile, tmp);
}
export function bakePrints(tile: HTMLCanvasElement) {
  const q = new Set<Print>();
  const tmp = document.createElement("canvas");
  const page = signal();
  let busy = false;
  // one print per idle slice; prints queued meanwhile join the queue
  const next = () => {
    const p = q.values().next().value;
    if (!p || page.aborted) {
      busy = false;
      return;
    }
    q.delete(p);
    idle(() => {
      void bake(p, tile, tmp, page).finally(next);
    });
  };
  const want = (p: Print) => {
    q.add(p);
    if (!busy) {
      busy = true;
      next();
    }
  };
  const prints = new Map<Element, Print>();
  // (its box untilted)
  const ro = watch(
    new ResizeObserver(es => {
      for (const e of es) {
        const p = prints.get(e.target);
        if (p) {
          p.size = [e.contentRect.width, e.contentRect.height];
          want(p);
        }
      }
    })
  );
  for (const ca of $$(".ca")) {
    const img = ca.querySelector("img");
    if (!img) {
      continue;
    }
    const p: Print = { ca, img, size: [0, 0], baked: "" };
    prints.set(ca, p);
    ro.observe(ca);
    img.addEventListener(
      "load",
      () => {
        want(p);
      },
      { signal: page }
    );
  }
}
