import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// the page engine draws on canvases and reads layout, neither of which jsdom has; pages render and behave without it
vi.mock("../engine", () => ({
  attach: () => ({ ready: Promise.resolve(null), detach: () => undefined }),
}));

window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
window.scrollTo = vi.fn();
// jsdom has no CSS.supports; the engine asks it which engine it runs in
vi.stubGlobal("CSS", { supports: () => false, escape: (value: string) => value });
window.scrollBy = vi.fn();
HTMLElement.prototype.scrollIntoView = vi.fn();
Element.prototype.animate = vi
  .fn()
  .mockReturnValue({ finished: Promise.resolve(), cancel: vi.fn() });
HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
globalThis.ResizeObserver = class {
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
};
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});
