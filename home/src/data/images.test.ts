import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { coverSet, PRINT, scaled, srcset, STEPS } from "./images";
import { coverPhoto, events } from "./photos";

const onDisk = (set: string) =>
  set
    .split(", ")
    .map(entry => entry.split(" ")[0] ?? "")
    .filter(src => !existsSync(path.join(process.cwd(), "public", src)));

describe("scaled copies", () => {
  it("names copies only between a photograph's own small file and its original", () => {
    expect(srcset("/a.webp", 1600, PRINT, { src: "/a-small.webp", w: 480 })).toBe(
      "/a-small.webp 480w, /a-640.webp 640w, /a-800.webp 800w, /a-960.webp 960w, /a-1280.webp 1280w, /a.webp 1600w"
    );
    expect(srcset("/b.webp", 700, STEPS, { src: "/b-small.webp", w: 480 })).toBe(
      "/b-small.webp 480w, /b.webp 700w"
    );
  });
  it.each(events)("$id: every print, cover and home copy a srcset names is in public", event => {
    const cover = coverPhoto(event);
    expect(onDisk(coverSet(cover.src, cover.width))).toEqual([]);
    expect(onDisk(`${scaled(cover.src, 480, "cover-")} 480w`)).toEqual([]);
    for (const photo of event.photos) {
      expect(
        onDisk(
          srcset(photo.src, photo.width, PRINT, { src: photo.thumbnail, w: photo.thumbnailWidth })
        )
      ).toEqual([]);
    }
  });
});
