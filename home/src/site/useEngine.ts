import { useLayoutEffect, useRef } from "react";

import { attach, type Engine, type PageCfg } from "../engine";

// the engine for this page: attached once the page's markup is in the document, detached when the route leaves
export function useEngine(cfg: PageCfg) {
  const ready = useRef<Promise<Engine | null>>(Promise.resolve(null));
  useLayoutEffect(() => {
    const h = attach(cfg);
    ready.current = h.ready;
    return () => {
      h.detach();
      ready.current = Promise.resolve(null);
    };
  }, [cfg]);
  return ready;
}
