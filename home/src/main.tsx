import { StrictMode } from "react";

import { BrowserRouter } from "react-router-dom";

import { createRoot, hydrateRoot } from "react-dom/client";

import "./styles/kit.css";
import "./styles/nav.css";
import "./styles/p-home.css";
import "./styles/p-work.css";
import "./styles/p-photos.css";
import "./styles/p-set.css";
import "./styles/p-resume.css";
import "./styles/p-guestbook.css";
import "./styles/p-404.css";
import App, { type Pages } from "./App";
import { lazyPage } from "./site/lazyPage";

// each page its own chunk; a built page's chunks are modulepreloaded in its HTML (scripts/build-metadata.mjs), the others are
// fetched once the first page is idle, so following a link shows the next page at once
const chunks = {
  Home: lazyPage(() => import("./pages/HomePage")),
  Work: lazyPage(() => import("./pages/WorkPage")),
  Resume: lazyPage(() => import("./pages/ResumePage")),
  Photos: lazyPage(() => import("./pages/PhotosPage")),
  Set: lazyPage(() => import("./pages/SetPage")),
  Guestbook: lazyPage(() => import("./pages/GuestbookPage")),
  NotFound: lazyPage(() => import("./pages/NotFoundPage")),
};
const pages = Object.fromEntries(
  Object.entries(chunks).map(([k, v]) => [k, v.Page])
) as unknown as Pages;
const prefetch = () => {
  const all = () => {
    for (const c of Object.values(chunks)) {
      c.prefetch();
    }
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(all, { timeout: 2000 });
  } else {
    setTimeout(all, 200);
  }
};
if (document.readyState === "complete") {
  prefetch();
} else {
  window.addEventListener("load", prefetch, { once: true });
}
const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing application root");
}
const app = (
  <StrictMode>
    <BrowserRouter>
      <App pages={pages} />
    </BrowserRouter>
  </StrictMode>
);
// a built page arrives rendered (entry-server.tsx) and is hydrated; the dev server's empty shell is rendered
if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
