import { lazy, useState, type ComponentType } from "react";

type Load = () => Promise<{ default: ComponentType }>;
// A page in its own chunk. Until its chunk is in it suspends (the built page it hydrates stays as it is); once fetched (by
// prefetch(), or its first showing) it renders at once, so a later visit has no frame without a page. The choice is made once
// per mount, so a page never swaps component (and remounts) under the visitor.
export function lazyPage(load: Load) {
  let loaded: ComponentType | null = null;
  const fetch = () =>
    load().then(m => {
      loaded = m.default;
      return m;
    });
  const Lazy = lazy(fetch);
  function Page() {
    const [Shown] = useState<ComponentType>(() => loaded ?? Lazy);
    return <Shown />;
  }
  return {
    Page,
    prefetch: () => {
      void fetch().catch(() => undefined);
    },
  };
}
