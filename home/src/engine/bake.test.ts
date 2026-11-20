import { describe, expect, it, vi } from "vitest";

import { bake, type Print } from "./bake";

describe("a Firefox print bake", () => {
  it("draws nothing and closes its bitmaps when its page goes while the bitmap decodes", async () => {
    const ca = document.createElement("span");
    ca.className = "ca";
    document.body.append(ca);
    const img = document.createElement("img");
    ca.append(img);
    for (const [k, v] of Object.entries({
      complete: true,
      naturalWidth: 960,
      currentSrc: "/a-960.webp",
    })) {
      Object.defineProperty(img, k, { value: v });
    }
    const p: Print = { ca, img, size: [320, 214], baked: "" };
    const close = vi.fn();
    let decoded: (b: ImageBitmap) => void = () => undefined;
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockReturnValueOnce(
        new Promise<ImageBitmap>(r => {
          decoded = r;
        })
      )
    );
    const page = new AbortController();
    const done = bake(
      p,
      document.createElement("canvas"),
      document.createElement("canvas"),
      page.signal
    );
    page.abort();
    decoded({ width: 960, height: 640, close });
    await done;
    expect(ca.querySelector("canvas")).toBeNull();
    expect(close).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it("closes the channels that resized when another channel's resize fails", async () => {
    const ca = document.createElement("span");
    ca.className = "ca";
    document.body.append(ca);
    const img = document.createElement("img");
    ca.append(img);
    for (const [k, v] of Object.entries({
      complete: true,
      naturalWidth: 960,
      currentSrc: "/b-960.webp",
    })) {
      Object.defineProperty(img, k, { value: v });
    }
    const p: Print = { ca, img, size: [320, 214], baked: "" };
    const bitmap = (close = vi.fn()) =>
      ({ width: 960, height: 640, close }) as unknown as ImageBitmap;
    const closes = [vi.fn(), vi.fn()];
    vi.stubGlobal(
      "createImageBitmap",
      vi
        .fn()
        .mockResolvedValueOnce(bitmap())
        .mockResolvedValueOnce(bitmap(closes[0]))
        .mockRejectedValueOnce(new Error("resize failed"))
        .mockResolvedValueOnce(bitmap(closes[1]))
    );
    await bake(
      p,
      document.createElement("canvas"),
      document.createElement("canvas"),
      new AbortController().signal
    );
    expect(ca.querySelector("canvas")).toBeNull();
    expect(closes[0]).toHaveBeenCalled();
    expect(closes[1]).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
