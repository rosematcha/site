// The directory's notes: from 680 px with a mouse or the keyboard, a link's note (the contribution's description and a link to it on
// Work) shows beside it; on touch the link simply goes to Work.
import type { Engine } from "../engine";
import { $$ } from "../engine/env";
import { later, sig } from "../engine/scope";

const wide = () => window.innerWidth >= 680;
function place(note: HTMLElement, a: Element) {
  note.hidden = false;
  const r = a.getBoundingClientRect();
  const w = note.offsetWidth;
  const h = note.offsetHeight;
  const gap = 8;
  const below = r.bottom + gap + h <= window.innerHeight;
  const x = Math.max(
    8,
    Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - w - 8)
  );
  note.style.left = `${String(x)}px`;
  note.style.top = `${String((below ? r.bottom + gap : r.top - gap - h) + window.scrollY)}px`;
}
export function initNotes(k: Engine, navigate: (to: string) => void) {
  const note = document.getElementById("contribution-note");
  const nt = note?.querySelector(".note-d");
  const na = note?.querySelector<HTMLAnchorElement>(".note-a");
  if (!note || !nt || !na) {
    return;
  }
  let owner: HTMLAnchorElement | null = null;
  let closeT = 0;
  const st = { touch: false };
  function show(a: HTMLAnchorElement) {
    clearTimeout(closeT);
    if (owner === a || !na || !nt || !note) {
      return;
    }
    owner?.removeAttribute("aria-describedby");
    owner = a;
    nt.textContent = a.dataset.note ?? "";
    na.textContent = a.dataset.action ?? "";
    na.href = a.getAttribute("href") ?? "";
    a.setAttribute("aria-describedby", "contribution-note");
    place(note, a);
    k.relayout();
  }
  function hide() {
    clearTimeout(closeT);
    if (!owner || !note) {
      return;
    }
    owner.removeAttribute("aria-describedby");
    owner = null;
    note.hidden = true;
    k.relayout();
  }
  const soon = () => {
    clearTimeout(closeT);
    closeT = later(hide, 160);
  };
  for (const a of $$<HTMLAnchorElement>(".dir a")) {
    a.addEventListener("pointerdown", e => (st.touch = e.pointerType !== "mouse"), sig());
    a.addEventListener(
      "pointerenter",
      e => {
        if (e.pointerType === "mouse" && wide()) {
          show(a);
        }
      },
      sig()
    );
    a.addEventListener("pointerleave", soon, sig());
    a.addEventListener(
      "focus",
      () => {
        if (wide() && !st.touch) {
          show(a);
        }
      },
      sig()
    );
    a.addEventListener("blur", soon, sig());
  }
  const keep = () => {
    clearTimeout(closeT);
  };
  note.addEventListener("pointerenter", keep, sig());
  note.addEventListener("pointerleave", soon, sig());
  note.addEventListener("focusin", keep, sig());
  note.addEventListener("focusout", soon, sig());
  // the note's link goes to Work through the router
  na.addEventListener(
    "click",
    e => {
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.button) {
        e.preventDefault();
        navigate(na.getAttribute("href") ?? "/work");
      }
    },
    sig()
  );
  document.addEventListener(
    "keydown",
    e => {
      if (e.key === "Escape" && owner) {
        const a = owner;
        hide();
        if (note.contains(document.activeElement)) {
          a.focus();
        }
      }
    },
    sig()
  );
  window.addEventListener("resize", hide, sig());
}
