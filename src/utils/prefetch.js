// Lightweight prefetch helpers to warm assets/data on intent
// Respect data saver and avoid duplicate work under React Strict Mode

import { projectsData } from "../data/projects";

const hasSaveData = () => {
  try {
    return typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData;
  } catch {
    return false;
  }
};

function preloadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve();
    const img = new Image();
    // Resolve on either load or error; goal is to warm caches/DNS
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let projectsPrefetchStarted = false;
export async function warmProjectsThumbnails() {
  if (projectsPrefetchStarted || hasSaveData()) return;
  projectsPrefetchStarted = true;
  try {
    // Queue thumbnails sequentially, first to last
    const urls = projectsData.map((p) => p.thumbnail).filter(Boolean);
    for (const url of urls) {
      await preloadImage(url);
      // Small gap to keep main thread responsive; tune if needed
      await sleep(100);
    }
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
      fetch(url, { method: "GET", credentials: "omit", cache: "no-store" }).catch(() => {});
      await sleep(50);
    }
  } catch {}
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
