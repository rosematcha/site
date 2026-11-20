// The nav (v25's, with round 10's Firefox-on-Android fixes): the wordmark row from 600 px; three bars at the top right on phones
// and once the row has scrolled away; big words on bare ground when open. The root's overflow is never touched (the menu is the
// scroller that swallows the gesture) and nothing writes `inert` (it restyled the whole page in the click).
import { $, $$, RM } from "./env";
import { wake } from "./frame";
import { later, psig, sig } from "./scope";

// a jump to a section: two frames after the menu closes; if the page hasn't moved 400 ms later, jump without smoothing
function jump(href: string) {
  const el = href === "#top" ? null : $(href);
  const go = () => {
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const y0 = window.scrollY;
    const to = el ? el.getBoundingClientRect().top + window.scrollY - pad : 0;
    const top = Math.max(
      0,
      Math.min(to, document.documentElement.scrollHeight - window.innerHeight)
    );
    window.scrollTo({ top, behavior: RM() ? "instant" : "smooth" });
    history.replaceState(history.state, "", href);
    later(() => {
      if (Math.abs(window.scrollY - y0) < 1 && Math.abs(window.scrollY - top) > 2) {
        window.scrollTo({ top, behavior: "instant" });
      }
    }, 400);
  };
  requestAnimationFrame(() => requestAnimationFrame(go));
}

export function initNav() {
  const btn = $(".bars-btn");
  const menu = $("#menu");
  const where = $(".where");
  if (!btn || !menu || !where) {
    return;
  }
  const pages = $$(".page");
  const rows = $$<HTMLAnchorElement>("a", menu);
  const links = [...rows, ...$$<HTMLAnchorElement>(".row-nav a")];
  const row = $(".row-nav");
  let open = false;
  let current = where.textContent;
  let byPointer = false;
  let hideT = 0;
  // the page names itself (its rows are marked current and the button's label written); only home tracks sections
  const tracks = Boolean($("[data-track]"));
  const secs: [string, HTMLElement | null][] = [
    ["Work", $("#work")],
    ["Photos", $("#photos")],
  ];
  const setCurrent = (n: string) => {
    if (n === current) {
      return;
    }
    current = n;
    where.textContent = n;
    for (const a of links) {
      if ((a.textContent ?? "").trim() === n) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    }
  };
  const section = () => {
    let n = "Home";
    for (const [name, el] of secs) {
      const r = el?.getBoundingClientRect();
      if (
        r &&
        r.top < window.innerHeight * 0.4 &&
        r.left < window.innerWidth * 0.6 &&
        r.right > 0
      ) {
        n = name;
      }
    }
    return n;
  };
  // read in the scroll event itself, which comes once a frame before any frame callback writes a style
  const track = () => {
    if (tracks) {
      setCurrent(section());
    }
    document.documentElement.classList.toggle("plated", window.scrollY > 24);
    document.documentElement.classList.toggle(
      "stand",
      !row || row.getBoundingClientRect().bottom < 0 || getComputedStyle(row).display === "none"
    );
  };
  window.addEventListener("scroll", track, psig());
  window.addEventListener("resize", track, sig());
  track();
  // The open menu covers the window, takes the first focus and keeps Tab on its rows, and (CSS) the faded page is hidden once its
  // 140 ms fade ends, which takes it out of hit-testing, focus and the accessibility tree; aria-hidden covers those 140 ms.
  const show = (v: boolean) => {
    open = v;
    btn.setAttribute("aria-expanded", String(v));
    document.documentElement.classList.toggle("menu-open", v);
    for (const p of pages) {
      if (v) {
        p.setAttribute("aria-hidden", "true");
      } else {
        p.removeAttribute("aria-hidden");
      }
    }
    clearTimeout(hideT);
    if (v) {
      menu.hidden = false;
      requestAnimationFrame(() => {
        menu.classList.add("in");
      });
      const to = rows.find(a => a.hasAttribute("aria-current")) ?? rows[0];
      // opened by a finger or a click: no focus ring (Firefox honours focusVisible: false), so no focus lamp either
      to?.focus(byPointer ? { preventScroll: true, focusVisible: false } : { preventScroll: true });
    } else {
      menu.classList.remove("in");
      hideT = later(
        () => {
          if (!open) {
            menu.hidden = true;
          }
        },
        RM() ? 120 : 140
      );
    }
    wake();
  };
  const close = () => {
    show(false);
    btn.focus({ preventScroll: true });
  };
  btn.addEventListener(
    "pointerdown",
    () => {
      byPointer = true;
      btn.classList.add("down");
    },
    sig()
  );
  btn.addEventListener(
    "keydown",
    () => {
      byPointer = false;
    },
    sig()
  );
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) {
    btn.addEventListener(
      ev,
      () => {
        btn.classList.remove("down");
      },
      sig()
    );
  }
  btn.addEventListener(
    "click",
    e => {
      if (e.detail === 0) {
        byPointer = false; // Enter or Space
      }
      show(!open);
      if (!open) {
        btn.focus({ preventScroll: true });
      }
    },
    sig()
  );
  menu.addEventListener(
    "click",
    e => {
      onMenu(e, show, close);
    },
    sig()
  );
  document.addEventListener(
    "keydown",
    e => {
      if (open) {
        onKey(e, btn, rows, close);
      }
    },
    sig()
  );
  // a page restored from the back-forward cache comes back with the menu closed
  window.addEventListener(
    "pageshow",
    e => {
      if (e.persisted && open) {
        show(false);
      }
    },
    sig()
  );
}
// a row to another page is a plain navigation (the router's); only # links jump; a click off the rows closes
function onMenu(e: MouseEvent, show: (v: boolean) => void, close: () => void) {
  const t = e.target instanceof Element ? e.target : null;
  const a = t?.closest("a");
  if (!a) {
    if (!t?.closest("li")) {
      close();
    }
    return;
  }
  const href = a.getAttribute("href") ?? "";
  show(false);
  if (a.target !== "_blank" && href.startsWith("#")) {
    e.preventDefault();
    jump(href);
  }
}
function onKey(e: KeyboardEvent, btn: HTMLElement, rows: HTMLElement[], close: () => void) {
  if (e.key === "Escape") {
    close();
    return;
  }
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const i = active ? rows.indexOf(active) : -1;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const step = e.key === "ArrowDown" ? 1 : rows.length - 1;
    rows[(Math.max(0, i) + step) % rows.length]?.focus({ preventScroll: true });
  }
  // focus stays on the button and the five rows
  if (e.key === "Tab") {
    const ring = [btn, ...rows];
    const j = active ? ring.indexOf(active) : -1;
    e.preventDefault();
    ring[(j + (e.shiftKey ? ring.length - 1 : 1)) % ring.length]?.focus({ preventScroll: true });
  }
}
