import type { Project } from "../data/site";

const images = new Map<string, Promise<void>>();
export function decodeProject(project: Project): Promise<void> {
  const cached = images.get(project.image);
  if (cached) {
    return cached;
  }
  const image = new Image();
  image.decoding = "async";
  image.src = project.image;
  const ready = image.decode().catch(() => {
    images.delete(project.image);
    throw new Error(`Couldn't load ${project.id}`);
  });
  images.set(project.image, ready);
  return ready;
}
export function warmProjectImages(projects: Project[]) {
  if (window.matchMedia("(prefers-reduced-data: reduce)").matches) {
    return;
  }
  projects.forEach(project => {
    void decodeProject(project).catch(() => undefined);
  });
}
export function previewRatio(project: Project): number {
  const source = project.width / project.height;
  if (source > 1.6) {
    return 1.6;
  }
  return source < 1 ? 1.25 : 1.5;
}
