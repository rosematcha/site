import { useEffect, useLayoutEffect, useRef } from "react";

import { NavigationType, useLocation, useNavigationType } from "react-router-dom";

interface Place {
  y: number;
  focusId?: string;
}
function hashTarget(hash: string): HTMLElement | null {
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}
function focusHash(hash: string) {
  const target = hashTarget(hash);
  target?.scrollIntoView({ block: hash === "#main-content" ? "start" : "center" });
  target?.focus({ preventScroll: true });
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
    const saved = store.get(location.key);
    const heading = document.querySelector<HTMLElement>("main h1");
    let frame = 0;
    function restore() {
      const initial = first.current;
      first.current = false;
      if (!pageChanged && !initial) {
        return;
      }
      if (location.hash) {
        focusHash(location.hash);
        return;
      }
      if (navigation === NavigationType.Pop && saved) {
        window.scrollTo({ top: saved.y, behavior: "instant" });
        const target = saved.focusId ? document.getElementById(saved.focusId) : heading;
        target?.focus({ preventScroll: true });
        return;
      }
      if (!initial) {
        window.scrollTo({ top: 0, behavior: "instant" });
        heading?.focus({ preventScroll: true });
      }
    }
    frame = requestAnimationFrame(restore);
    function remember(event?: MouseEvent) {
      const target = event?.target;
      const link =
        target instanceof Element ? target.closest<HTMLElement>("[data-restore-focus]") : null;
      const existing = store.get(location.key);
      store.set(location.key, { y: window.scrollY, focusId: link?.id ?? existing?.focusId });
    }
    const onScroll = () => {
      remember();
    };
    document.addEventListener("click", remember, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", remember, true);
      window.removeEventListener("scroll", onScroll);
    };
  }, [location.key, location.hash, location.pathname, navigation]);
}
