import { useEffect } from "react";

const siteTitle = "rosematcha · Reese Lundquist";
export function usePageMeta(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${siteTitle}` : siteTitle;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute(
        "href",
        `https://rosematcha.com${location.pathname.replace(/\/+$/, "") || "/"}`
      );
  }, [title]);
}
