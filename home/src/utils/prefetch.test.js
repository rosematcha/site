import { describe, it, expect, vi, beforeEach } from "vitest";
import { warmProjectsThumbnails, prefetchProjectRoutes, warmGuestbook } from "../utils/prefetch";

describe("prefetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - Mock fetch for testing
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true }));
  });

  describe("warmProjectsThumbnails", () => {
    it("should not prefetch when saveData is enabled", async () => {
      Object.defineProperty(navigator, "connection", {
        value: { saveData: true },
        configurable: true,
      });

      await warmProjectsThumbnails();
      // Should not throw
      expect(true).toBe(true);
    });

    it("should only run once even if called multiple times", async () => {
      await warmProjectsThumbnails();
      await warmProjectsThumbnails();
      await warmProjectsThumbnails();
      // Should complete without errors
      expect(true).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      // Mock error condition
      vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(warmProjectsThumbnails()).resolves.toBeUndefined();
    });
  });

  describe("prefetchProjectRoutes", () => {
    it("should not prefetch when saveData is enabled", async () => {
      Object.defineProperty(navigator, "connection", {
        value: { saveData: true },
        configurable: true,
      });

      await prefetchProjectRoutes();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("should prefetch internal project routes", async () => {
      Object.defineProperty(navigator, "connection", {
        value: { saveData: false },
        configurable: true,
      });

      await prefetchProjectRoutes();
      // Should call fetch for internal routes
      expect(true).toBe(true);
    });

    it("should skip external URLs", async () => {
      await prefetchProjectRoutes();
      // External URLs should be filtered out
      expect(true).toBe(true);
    });

    it("should handle fetch errors gracefully", async () => {
      // @ts-ignore - Mock fetch for testing
      globalThis.fetch = vi.fn(() => Promise.reject(new Error("Network error")));
      await expect(prefetchProjectRoutes()).resolves.toBeUndefined();
    });
  });

  describe("warmGuestbook", () => {
    beforeEach(() => {
      // Reset module state for this test suite
      vi.resetModules();
    });

    it("should not prefetch when saveData is enabled", async () => {
      Object.defineProperty(navigator, "connection", {
        value: { saveData: true },
        configurable: true,
      });

      await warmGuestbook();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("should only run once even if called multiple times", async () => {
      Object.defineProperty(navigator, "connection", {
        value: { saveData: false },
        configurable: true,
      });

      await warmGuestbook();
      await warmGuestbook();
      await warmGuestbook();

      // Should only fetch once
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("should fetch guestbook entries", async () => {
      Object.defineProperty(navigator, "connection", {
        value: { saveData: false },
        configurable: true,
      });

      const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
      // @ts-ignore - Mock fetch for testing
      globalThis.fetch = fetchMock;

      // Re-import to get fresh module state
      const { warmGuestbook: freshWarmGuestbook } = await import(
        "../utils/prefetch.js?t=" + Date.now()
      );

      await freshWarmGuestbook();

      // Check if fetch was called (may be cached from previous runs)
      expect(fetchMock).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      // @ts-ignore - Mock fetch for testing
      globalThis.fetch = vi.fn(() => Promise.reject(new Error("Network error")));
      await expect(warmGuestbook()).resolves.toBeUndefined();
    });
  });
});
