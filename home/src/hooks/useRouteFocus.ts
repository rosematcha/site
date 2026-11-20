import { useEffect, useLayoutEffect, useRef } from "react";

import { NavigationType, useLocation, useNavigationType } from "react-router-dom";

import { requestArrival } from "../engine/arrival";
import { whenShown } from "../site/shown";

// One saved place per history entry: its scroll, its shelves' scroll and the element that had focus. Keyed by the entry itself
// (an id kept in its history state), since entries a plain #link makes share the router's "default" key.
interface Place {
  y: number;
  shelves: number[];
  focusId?: string;
}
let made = 0;
const stateOf = (): unknown => history.state;
function entryId(): string {
  const state = stateOf();
  const kept = state && typeof state === "object" && "place" in state ? state.place : null;
  if (typeof kept === "string") {
    return kept;
  }
  made += 1;
  const id = `${String(Date.now())}-${String(made)}`;
  history.replaceState({ ...(state && typeof state === "object" ? state : {}), place: id }, "");
  return id;
}
const shelves = () => [...document.querySelectorAll(".shelf")];
function hashTarget(hash: string): HTMLElement | null {
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}
// a plate in a shelf (or a hash whose page is still loading) is the engine's to arrive at: its stop to the column edge, its
// heading under the nav
function focusHash(hash: string) {
  const target = hashTarget(hash);
  if (!target || target.closest(".shelf [data-stop]")) {
    requestArrival();
    return;
  }
  target.scrollIntoView({ block: hash === "#main" ? "start" : "center" });
  target.focus({ preventScroll: true });
}
function returnTo(saved: Place, heading: HTMLElement | null) {
  window.scrollTo({ top: saved.y, behavior: "instant" });
  shelves().forEach((shelf, i) => {
    shelf.scrollLeft = saved.shelves[i] ?? shelf.scrollLeft;
  });
  const target = saved.focusId ? document.getElementById(saved.focusId) : heading;
  target?.focus({ preventScroll: true });
}
// a press on a link or button with an id (a cover that opens its set), or a focus landing on an element with one (an arrival's
// cover, main after Skip), is the element to return to
function focusOf(event: Event) {
  const { target } = event;
  if (event.type === "click" && target instanceof Element) {
    return target.closest<HTMLElement>("a[id], button[id]")?.id;
  }
  return event.type === "focusin" && target instanceof HTMLElement && target.id
    ? target.id
    : undefined;
}
export function useRouteFocus() {
  const location = useLocation();
  const navigation = useNavigationType();
  const places = useRef(new Map<string, Place>());
  const first = useRef(true);
  const previousPath = useRef({ path: location.pathname, hash: location.hash });
  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);
  useLayoutEffect(() => {
    const pageChanged =
      previousPath.current.path !== location.pathname ||
      previousPath.current.hash !== location.hash;
    previousPath.current = { path: location.pathname, hash: location.hash };
    const store = places.current;
    const id = entryId();
    const saved = store.get(id);
    function restore() {
      const heading = document.querySelector<HTMLElement>("main h1");
      const initial = first.current;
      first.current = false;
      if (!pageChanged && !initial) {
        return;
      }
      // Back or Forward returns to the saved place, over any hash; a fresh navigation to a hash arrives at it
      if (navigation === NavigationType.Pop && saved && !initial) {
        returnTo(saved, heading);
        return;
      }
      if (location.hash) {
        focusHash(location.hash);
        return;
      }
      if (!initial) {
        window.scrollTo({ top: 0, behavior: "instant" });
        heading?.focus({ preventScroll: true });
      }
    }
    // once this location's page is in the document (its chunk may still be loading)
    let frame = 0;
    const cancel = whenShown(location.pathname, () => {
      frame = requestAnimationFrame(restore);
    });
    // the place is kept as the visitor leaves it
    function remember(event: Event) {
      store.set(id, {
        y: window.scrollY,
        shelves: shelves().map(shelf => shelf.scrollLeft),
        focusId: focusOf(event) ?? store.get(id)?.focusId,
      });
    }
    document.addEventListener("click", remember, true);
    document.addEventListener("focusin", remember, true);
    document.addEventListener("scroll", remember, { capture: true, passive: true });
    return () => {
      cancel();
      cancelAnimationFrame(frame);
      document.removeEventListener("click", remember, true);
      document.removeEventListener("focusin", remember, true);
      document.removeEventListener("scroll", remember, { capture: true });
    };
  }, [location.key, location.hash, location.pathname, navigation]);
}
