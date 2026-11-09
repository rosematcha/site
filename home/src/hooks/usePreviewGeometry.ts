import { useLayoutEffect, type RefObject } from "react";

function measureGeometry(section: HTMLElement, frame: HTMLElement, layout: HTMLElement) {
  const navHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 70;
  const compact = window.innerWidth < 1024;
  const stickyNav = window.innerWidth >= 680 ? navHeight : 0;
  const room = Math.max(120, window.innerHeight - navHeight);
  if (compact) {
    const height = Math.round(
      Math.max(
        window.innerHeight < 600 ? 100 : 160,
        Math.min(320, (window.innerHeight - stickyNav) * 0.38)
      )
    );
    section.style.setProperty("--compact-top", `${String(stickyNav)}px`);
    section.style.setProperty("--compact-height", `${String(height)}px`);
    section.style.setProperty("--compact-image-height", `${String(height - 32)}px`);
    section.style.setProperty("--project-scroll-margin", `${String(height + stickyNav + 24)}px`);
    return;
  }
  section.style.setProperty("--preview-height", `${String(Math.max(100, room - 72))}px`);
  const top = navHeight + (room - frame.offsetHeight) / 2;
  const origin = layout.getBoundingClientRect().top + window.scrollY;
  section.style.setProperty("--preview-top", `${String(top)}px`);
  section.style.setProperty(
    "--preview-entry-space",
    `${String(Math.max(24, top + 64 - origin))}px`
  );
  section.style.setProperty("--project-scroll-margin", `${String(navHeight + 32)}px`);
}
export function usePreviewGeometry(
  section: RefObject<HTMLElement | null>,
  frame: RefObject<HTMLDivElement | null>,
  layout: RefObject<HTMLDivElement | null>
) {
  useLayoutEffect(() => {
    const sectionElement = section.current;
    const frameElement = frame.current;
    const layoutElement = layout.current;
    if (!sectionElement || !frameElement || !layoutElement) {
      throw new Error("Preview elements are not mounted");
    }
    const update = () => {
      measureGeometry(sectionElement, frameElement, layoutElement);
    };
    const observer = new ResizeObserver(update);
    observer.observe(frameElement);
    observer.observe(document.documentElement);
    window.addEventListener("resize", update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [section, frame, layout]);
}
