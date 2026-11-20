// Photos: the sets as one shelf per year, newest first. Each plate is home's photo plate (the cover at its own aspect, the site's
// alt, the title) and opens its set; the year is the band's heading and stays in each link's accessible name only.
import type { CSSProperties } from "react";

import { coverSet, scaled } from "../data/images";
import { coverPhoto, events, type PhotoEvent } from "../data/photos";
import type { PageCfg } from "../engine";
import { Ca, Clip, PHead, Shelf, To } from "../site/markup";
import { Page } from "../site/Page";
import { useEngine } from "../site/useEngine";

// the vertical sweep swept 15.8% of the first screen at home's 0.26; bake: Firefox draws each cover once
const CFG: PageCfg = { gain: { wide: [0.74, 0.38] }, bake: true };
const YEARS = [...new Set(events.map(e => e.year))].sort((a, b) => Number(b) - Number(a));
// the cover is drawn --ph times its aspect wide, --ph by window (the CSS's); a phone's 320 picks the 960 copy (3% upscale, unseen)
const PH: [number, number][] = [
  [1280, 340],
  [900, 288],
  [600, 260],
  [0, 220],
];
function coverSizes(ar: number) {
  return PH.map(([m, ph]) =>
    m
      ? `(min-width: ${String(m)}px) ${String(Math.round(ph * ar))}px`
      : `${String(Math.min(Math.round(ph * ar), 320))}px`
  ).join(", ");
}
function Cover({ e, first }: { e: PhotoEvent; first: boolean }) {
  const c = coverPhoto(e);
  const ar = c.width / c.height;
  const w = 480; // the cover-480 copy
  return (
    <To
      className="tile ph"
      id={`event-${e.id}`}
      style={{ "--ar": ar.toFixed(4) } as CSSProperties}
      to={`/photos/${e.id}`}
    >
      <Clip h={8}>
        <Ca
          p={{
            src: scaled(c.src, 480, "cover-"),
            alt: c.alt,
            w,
            h: Math.round(w / ar),
            srcSet: coverSet(c.src, c.width),
            sizes: coverSizes(ar),
            load: first ? "eager" : "lazy",
          }}
        />
      </Clip>
      <h3 className="t">{e.title}</h3>
      <span className="sr"> {e.year}</span>
    </To>
  );
}
export default function PhotosPage() {
  useEngine(CFG);
  return (
    <Page current="Photos" id="p-photos" title="Photos">
      <main className="page" id="main" tabIndex={-1}>
        <PHead title="Photos" />
        {YEARS.map(y => (
          <section key={y} aria-labelledby={`y-${y}`} className="yr">
            <h2 className="col" data-ts="4" id={`y-${y}`}>
              {y}
            </h2>
            <Shelf
              cls="phs"
              items={events.filter(e => e.year === y)}
              keyOf={e => e.id}
              label={`y-${y}`}
              render={(e, i) => <Cover e={e} first={i < 2 && y === YEARS[0]} />}
            />
          </section>
        ))}
      </main>
    </Page>
  );
}
