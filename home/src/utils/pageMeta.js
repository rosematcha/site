// Per-route document title. The app is a single HTML file, so without this
// every route shares index.html's title and a shared or bookmarked link to
// the resume reads as the generic site name.
import { useEffect } from "react";

const SITE = "rosematcha · Reese Lundquist";

export function pageTitle(title) {
  return title ? `${title} · ${SITE}` : SITE;
}

export function usePageTitle(title) {
  useEffect(() => {
    const full = pageTitle(title);
    document.title = full;
    const og = document.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute("content", full);
    return () => {
      document.title = SITE;
      if (og) og.setAttribute("content", SITE);
    };
  }, [title]);
}
