// Home (v27): the greeting with the upright portrait, then three shelves: personal projects, client work, the newest photo sets.
import { sizesOf, srcset, STEPS } from "../data/images";
import { coverPhoto, events, type PhotoEvent } from "../data/photos";
import { clients, homeProjects } from "../data/portfolio";
import type { PageCfg } from "../engine";
import { Ca, Clip, Head, Plate, Shelf, To, type Pic } from "../site/markup";
import { Page } from "../site/Page";
import { useEngine } from "../site/useEngine";

// the phone hero swept 42% of the first screen at the kit's 0.34 vertical gain; 0.27 keeps it in the 20 to 40% band
// one text node, so the greeting shapes as one run
const GREETING = "Howdy, I'm\u00a0Reese!";
const INTRO =
  "I'm a web developer, photographer, organizer, and youth educator, with backgrounds in the arts, non-profits, and politics. I love making and doing cool things that help people. Welcome to my site!";
const CFG: PageCfg = { rest: [0.4, 0.28], gain: { phone: [1.25, 0.27] } };
// the camera photo first (cropped to the upright frame on Reese and the camera), the Kirby one second
const PRINTS: [string, string, number, number, string][] = [
  ["/img/portraits/me-camera-halation.webp", "Reese taking a photo", 1100, 733, "44% 50%"],
  ["/img/portraits/me-soykirb-halation.webp", "Reese with Kirby plush toys", 666, 900, "50% 12%"],
];
// the 4:5 clip's width by window, for the prints' sizes
const HERO_BOX: [string, string][] = [
  ["(max-width: 599px)", "calc(100vw - 275px)"],
  ["(max-width: 1023px)", "282px"],
];
const heroPics: Pic[] = PRINTS.map(([src, alt, w, h, pos], i) => ({
  src,
  alt,
  w,
  h,
  pos,
  srcSet: srcset(src, w, STEPS),
  sizes: sizesOf(HERO_BOX, "341px", w / h, 0.8),
  load: i ? "defer" : "eager",
}));
const shelved = clients.filter(c => c.image);
// the eight most recent sets, newest first, each by its cover's small file (the photo plate's picture is --ph tall: 200 on a
// phone, 300 from 600 px)
function photoPic(e: PhotoEvent): Pic {
  const c = coverPhoto(e);
  const { thumbnailWidth: w, thumbnailHeight: h } = c;
  const ar = w / h;
  return {
    src: c.thumbnail,
    alt: c.alt,
    w,
    h,
    srcSet: srcset(c.src, c.width, STEPS, { src: c.thumbnail, w }),
    sizes: `(max-width: 599px) ${String(Math.round(200 * ar))}px, ${String(Math.round(300 * ar))}px`,
  };
}
function Portrait() {
  return (
    <button aria-label="Next photo of Reese" className="portrait" data-light="off" type="button">
      <Clip h={12}>
        {heroPics.map((p, i) => (
          <span key={p.src} className={`print${i ? "" : " on"}`} data-alt={p.alt}>
            <Ca p={{ ...p, alt: i ? "" : p.alt }} />
          </span>
        ))}
      </Clip>
    </button>
  );
}
export default function HomePage() {
  useEngine(CFG);
  return (
    <Page home current="Home" id="p-home" title={null}>
      <main className="page" id="main" tabIndex={-1}>
        <section aria-label="Introduction" className="hero col">
          <h1 data-ts="5" tabIndex={-1}>
            {GREETING}
          </h1>
          <Portrait />
          <div className="intro">
            <p>{INTRO}</p>
            <button hidden className="tilt-ask" type="button">
              Tilt to move the light
            </button>
          </div>
        </section>
        <section aria-labelledby="t-work" className="sec s-pj" id="work">
          <Head id="work" more={["See all projects", "/work"]} title="Personal projects" />
          <Shelf
            cls="pjs"
            items={homeProjects}
            keyOf={p => p.id}
            render={p => <Plate p={p} size={[p.width, p.height]} />}
          />
        </section>
        <section aria-labelledby="t-clients" className="sec s-cl" id="clients">
          <Head id="clients" more={["See my resume", "/resume"]} title="Client work" />
          <Shelf
            cls="cls"
            items={shelved}
            keyOf={c => c.id}
            render={c => (
              <Plate cls="cl" h={8} p={c} size={[c.width, c.height]} to={`/work#client-${c.id}`} />
            )}
          />
        </section>
        <section aria-labelledby="t-photos" className="sec s-ph" id="photos">
          <Head id="photos" more={["See all photos", "/photos"]} title="Photos" />
          <Shelf
            cls="phs"
            items={events.slice(0, 8)}
            keyOf={e => e.id}
            render={e => {
              const p = photoPic(e);
              return (
                <To
                  className="tile ph"
                  style={{ "--ar": (p.w / p.h).toFixed(4) } as React.CSSProperties}
                  to={`/photos/${e.id}`}
                >
                  <Clip h={8}>
                    <Ca p={p} />
                  </Clip>
                  <h3 className="t">{e.title}</h3>
                  <p className="year">{e.year}</p>
                </To>
              );
            }}
          />
        </section>
      </main>
    </Page>
  );
}
