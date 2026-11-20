// A photo set: a sheet of prints in justified rows; a tapped print is lifted alone onto bare ground (a modal <dialog> with no fill).
// An unknown set is Not found.
import { useEffect, type CSSProperties } from "react";

import { useParams } from "react-router-dom";

import { PRINT, srcset } from "../data/images";
import { events, type Photo, type PhotoEvent } from "../data/photos";
import { printSizes, rowsOf } from "../data/sheet";
import type { PageCfg } from "../engine";
import { Label, To } from "../site/markup";
import { Page } from "../site/Page";
import { useEngine } from "../site/useEngine";

import NotFoundPage from "./NotFoundPage";
import { initViewer } from "./viewer";

// bake: Firefox draws each print once; the vertical sweeps swept 14.4% (1024) and 19.3% (390) at home's gains, and pictures fill
// this first screen, so the 1024 sweep levels off near 20% from 0.62 up
const CFG: PageCfg = { gain: { wide: [0.74, 0.62], phone: [1.25, 0.66] }, bake: true };

function Print({ p, i, ar, sizes }: { p: Photo; i: number; ar: number; sizes: string }) {
  const tw = p.thumbnailWidth;
  const img = (alt: string) => (
    <img
      alt={alt}
      decoding="async"
      draggable={false}
      fetchPriority={i < 2 ? "high" : undefined}
      height={p.thumbnailHeight}
      loading={i < 2 ? undefined : "lazy"}
      sizes={sizes}
      src={p.thumbnail}
      srcSet={srcset(p.src, p.width, PRINT, { src: p.thumbnail, w: tw })}
      width={tw}
    />
  );
  return (
    <button
      aria-label={`Enlarge photo ${String(i + 1)}: ${p.alt}`}
      className="tile ph print-b"
      data-i={i}
      style={{ "--ar": ar.toFixed(4) } as CSSProperties}
      type="button"
    >
      <span className="obj" data-h="8">
        <span className="face">
          <span className="clip">
            <span className="ca">
              <span className="ch r">{img(p.alt)}</span>
              <span aria-hidden="true" className="ch g">
                {img("")}
              </span>
              <span aria-hidden="true" className="ch b">
                {img("")}
              </span>
            </span>
            <span aria-hidden="true" className="pgrain" />
          </span>
        </span>
      </span>
    </button>
  );
}
function Pill({ cls, label }: { cls: string; label: string }) {
  return (
    <button className={`btn ${cls}`} type="button">
      <Label>{label}</Label>
    </button>
  );
}
function Sheet({ e }: { e: PhotoEvent }) {
  const ars = e.photos.map(p => p.width / p.height);
  const rows = rowsOf(ars);
  const sizes = printSizes(ars, rows);
  return (
    <div className="sheet col">
      {rows.map((r, j) => (
        <div key={r.join()} className={`srow${j === rows.length - 1 ? " end" : ""}`}>
          {r.map(i => {
            const p = e.photos[i];
            return p ? (
              <Print key={p.id} ar={ars[i] ?? 1} i={i} p={p} sizes={sizes[i] ?? ""} />
            ) : null;
          })}
        </div>
      ))}
    </div>
  );
}
function SetView({ e }: { e: PhotoEvent }) {
  const engine = useEngine(CFG);
  useEffect(() => {
    void engine.current.then(k => {
      if (k) {
        initViewer(e, k);
      }
    });
  }, [e, engine]);
  return (
    <Page set current="Photos" id="p-set" title={`${e.title} ${e.year}`}>
      <main className="page" id="main" tabIndex={-1}>
        <div className="shead-slot">
          <div className="phead shead col">
            <h1 data-ts="5" tabIndex={-1}>
              {e.title}
            </h1>
            <p className="syr">{e.year}</p>
            <To className="btn back" to={`/photos#event-${e.id}`}>
              <Label>Back to photos</Label>
            </To>
          </div>
        </div>
        <Sheet e={e} />
      </main>
      <dialog className="viewer" data-light="off">
        <Pill cls="v-close" label="Close" />
        <div className="v-in">
          <div className="v-stage">
            <div className="v-fly">
              <span className="obj v-obj" data-h="20" data-lamp="off">
                <span className="face">
                  <span className="clip">
                    <img alt="" className="v-img" draggable={false} />
                  </span>
                </span>
              </span>
            </div>
          </div>
          <div className="v-bar">
            <Pill cls="v-prev" label="Previous" />
            <p aria-live="polite" className="v-cap" />
            <Pill cls="v-next" label="Next" />
          </div>
        </div>
      </dialog>
    </Page>
  );
}
export default function SetPage() {
  const { eventId } = useParams();
  const e = events.find(x => x.id === eventId);
  return e ? <SetView e={e} /> : <NotFoundPage />;
}
