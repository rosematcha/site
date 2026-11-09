import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";

import { featuredProjects, projects, type Project } from "../data/site";

function linkAtY(links: HTMLElement[], y: number): HTMLElement | undefined {
  return links.find(link => {
    const rect = link.getBoundingClientRect();
    return y >= rect.top && y < rect.bottom;
  });
}
function scrollProject(section: HTMLElement): HTMLElement | undefined {
  const compact = window.innerWidth < 1024;
  const stage = section.querySelector<HTMLElement>(".preview-column");
  const nav = document.querySelector<HTMLElement>(".site-header");
  const bottom = compact
    ? (stage?.getBoundingClientRect().bottom ?? 0)
    : (nav?.getBoundingClientRect().bottom ?? 0);
  const anchor = bottom + Math.min(110, Math.max(40, (window.innerHeight - bottom) * 0.2));
  const links = [...section.querySelectorAll<HTMLElement>("[data-preview-id]")].filter(
    link => link.getBoundingClientRect().bottom > bottom + 8
  );
  return (
    linkAtY(links, anchor) ??
    links.reduce<HTMLElement | undefined>((best, link) => {
      if (!best) {
        return link;
      }
      return Math.abs(link.getBoundingClientRect().top - anchor) <
        Math.abs(best.getBoundingClientRect().top - anchor)
        ? link
        : best;
    }, undefined)
  );
}
function pointerProject(root: HTMLElement, point: { x: number; y: number } | null) {
  if (window.innerWidth < 1024 || !point) {
    return undefined;
  }
  const navBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
  if (point.y <= navBottom || root.getBoundingClientRect().bottom <= point.y) {
    return undefined;
  }
  const direct = document
    .elementFromPoint(point.x, point.y)
    ?.closest<HTMLElement>("[data-preview-id]");
  if (direct && root.contains(direct)) {
    return direct;
  }
  return linkAtY([...root.querySelectorAll<HTMLElement>(".featured-project")], point.y);
}
export function useProjectSelection(section: RefObject<HTMLElement | null>) {
  const first = featuredProjects[0];
  if (!first) {
    throw new Error("No featured projects");
  }
  const [selected, setSelected] = useState<Project>(first);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const keyboard = useRef(false);
  const raf = useRef(0);
  const select = useCallback((id: string) => {
    const project = projects.find(item => item.id === id);
    if (project) {
      setSelected(project);
    }
  }, []);
  const update = useCallback(() => {
    const root = section.current;
    if (!root) {
      return;
    }
    const hover = pointerProject(root, pointer.current);
    const focus = keyboard.current
      ? document.activeElement?.closest<HTMLElement>("[data-preview-id]")
      : null;
    const link = hover ?? focus ?? scrollProject(root);
    const id = link?.dataset.previewId;
    if (id) {
      select(id);
    }
  }, [section, select]);
  useEffect(() => {
    function schedule() {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(update);
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Tab") {
        keyboard.current = true;
      }
    }
    function down() {
      keyboard.current = false;
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", down);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", down);
    };
  }, [update]);
  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") {
      return;
    }
    pointer.current = { x: event.clientX, y: event.clientY };
    if (window.innerWidth < 1024) {
      return;
    }
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(update);
  }
  return {
    selected,
    select,
    onPointerMove,
    onPointerLeave: () => {
      pointer.current = null;
    },
  };
}
