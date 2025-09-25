// Lightweight prefetch helpers to warm assets/data on intent
// Respect data saver and avoid duplicate work under React Strict Mode

import { projectsData } from "../data/projects";
import { loadProjectThumbnails } from "./imageLoader";

const hasSaveData = () => {
  try {
    return typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData;
  } catch {
    return false;
  }
};

let projectsPrefetchStarted = false;
export async function warmProjectsThumbnails() {
  if (projectsPrefetchStarted || hasSaveData()) return;
  projectsPrefetchStarted = true;
  try {
    // Use enhanced parallel loading from imageLoader utility
    await loadProjectThumbnails(projectsData);
  } catch {
    // noop
  }
}

function isInternal(path) {
  return path && !path.startsWith("http");
}

export async function prefetchProjectRoutes() {
  if (hasSaveData()) return;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    for (const p of projectsData) {
      if (!isInternal(p.path)) continue;
      const url = `${base}${p.path}`;
      // Fire-and-forget GET to warm server/DNS/CDN and browser cache
      // Use default caching so this actually populates the HTTP cache
      fetch(url, { method: "GET", credentials: "omit", cache: "default" }).catch(() => {});
    }
  } catch {
    // ignore
  }
}

let guestbookPrefetchStarted = false;
export async function warmGuestbook() {
  if (guestbookPrefetchStarted || hasSaveData()) return;
  guestbookPrefetchStarted = true;
  try {
    // Kick off the fetch so the function cold start and data load happen ahead of navigation
    // Avoid credentials for a simple public read; let browser cache responses by default
    await fetch("/.netlify/functions/get-guestbook-entries", {
      method: "GET",
      credentials: "omit",
      // Use default caching; Netlify Functions may set caching headers
      cache: "default",
    }).catch(() => {});
  } catch {
    // ignore
  }
}
