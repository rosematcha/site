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

// Best-effort: add <link rel="preload" as="image"> hints for earlier fetch
function addPreloadLink(url, priority = "auto") {
  try {
    if (typeof document === "undefined" || !url) return;
    // Avoid duplicating the same preload
    const existing = document.querySelector(
      `link[rel="preload"][as="image"][href="${url}"]`
    );
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    // Priority hint is supported in modern Chromium; safe to ignore elsewhere
    // @ts-ignore
    link.fetchpriority = priority; // "high" | "low" | "auto"
    document.head.appendChild(link);
  } catch {
    // ignore
  }
}

let projectsPrefetchStarted = false;
export async function warmProjectsThumbnails() {
  if (projectsPrefetchStarted || hasSaveData()) return;
  projectsPrefetchStarted = true;
  try {
  // Gather thumbnail URLs
  const urls = projectsData.map((p) => p.thumbnail).filter(Boolean);
  if (urls.length === 0) return;

  // Hint the first couple as high priority for quick above-the-fold paint
  const headStart = urls.slice(0, 2);
  headStart.forEach((u) => addPreloadLink(u, "high"));

  // Preload first few concurrently to maximize overlap
  await Promise.all(headStart.map((u) => preloadImage(u)));

  // Warm the remaining in the background with low priority hints
  const rest = urls.slice(2);
  rest.forEach((u) => addPreloadLink(u, "low"));
  await Promise.all(rest.map((u) => preloadImage(u)));
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
