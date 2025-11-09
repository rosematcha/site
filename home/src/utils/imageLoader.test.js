import { describe, it, expect, vi } from "vitest";
import { loadProjectThumbnails, loadRestaurantLogos, createImageObserver } from "./imageLoader";

describe("imageLoader", () => {
  describe("loadProjectThumbnails", () => {
    it("should resolve immediately (no-op)", async () => {
      await expect(loadProjectThumbnails()).resolves.toBeUndefined();
    });
  });

  describe("loadRestaurantLogos", () => {
    it("should return empty Map (no-op)", async () => {
      const result = await loadRestaurantLogos();
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe("createImageObserver", () => {
    it("should return null if IntersectionObserver not supported", () => {
      const originalIO = window.IntersectionObserver;
      // @ts-ignore
      delete window.IntersectionObserver;

      const mockImg = document.createElement("img");
      const result = createImageObserver(mockImg, vi.fn());

      expect(result).toBeNull();
      window.IntersectionObserver = originalIO;
    });

    it("should return null for invalid inputs", () => {
      const result1 = createImageObserver(null, vi.fn());
      expect(result1).toBeNull();

      const mockImg = document.createElement("img");
      const result2 = createImageObserver(mockImg, null);
      expect(result2).toBeNull();
    });

    it("should create observer with correct config", () => {
      // Mock IntersectionObserver as a proper constructor
      // @ts-ignore - Mock for testing
      globalThis.IntersectionObserver = class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      };

      const mockImg = document.createElement("img");
      const callback = vi.fn();
      const observer = createImageObserver(mockImg, callback);

      expect(observer).toBeDefined();
      expect(observer.observe).toBeDefined();
      observer?.disconnect();
    });
  });
});
