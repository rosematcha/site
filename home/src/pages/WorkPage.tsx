// Work: home's shelves at full length and three scales. Shelf A, the five main projects, large; shelf B, the smaller projects;
// shelf C, the clients, where a client without a picture is set as its name (a type plate). Every cell is one link out to the
// real site; Resume's and home's links land here on /work#client-<id> or #project-<id>.
import { useEffect } from "react";

import { clients, featuredProjects, smallerProjects } from "../data/portfolio";
import type { PageCfg } from "../engine";
import { PHead, Plate, Shelf, TypePlate } from "../site/markup";
import { Page } from "../site/Page";
import { useEngine } from "../site/useEngine";

// a little more vertical travel than home: the h1 band and plates swept 19% at 0.26
const CFG: PageCfg = { gain: { wide: [0.74, 0.3] } };
// the air under a shelf is measured from its plates seen at rest (the first screen), not from its tallest plate, which is often
// off screen. --tail pulls what follows up by the difference; the tall plate keeps its whole description
function fit(ul: Element) {
  let all = 0;
  let seen = 0;
  for (const li of ul.children) {
    const h = li.getBoundingClientRect().height;
    all = Math.max(all, h);
    if (li instanceof HTMLElement && li.offsetLeft < ul.clientWidth) {
      seen = Math.max(seen, h);
    }
  }
  if (ul instanceof HTMLElement) {
    ul.style.setProperty("--tail", `${(all - seen).toFixed(1)}px`);
  }
}
function useTails() {
  useEffect(() => {
    // each plate is watched too: a font arriving can change a seen plate while the tallest, and so the shelf, keeps its height
    const ro = new ResizeObserver(es => {
      new Set(es.map(x => x.target.closest(".shelf"))).forEach(ul => {
        if (ul) {
          fit(ul);
        }
      });
    });
    for (const ul of document.querySelectorAll(".wk .shelf")) {
      fit(ul);
      ro.observe(ul);
      for (const li of ul.children) {
        ro.observe(li);
      }
    }
    return () => {
      ro.disconnect();
    };
  }, []);
}
export default function WorkPage() {
  useEngine(CFG);
  useTails();
  return (
    <Page current="Work" id="p-work" title="Work">
      <main className="page" id="main" tabIndex={-1}>
        <section aria-labelledby="t-top" className="wk wk-a">
          <PHead id="t-top" title="Personal projects" />
          <Shelf
            cls="wa"
            items={featuredProjects}
            keyOf={p => p.id}
            label="t-top"
            render={p => (
              <Plate h={12} id={`project-${p.id}`} p={p} size={[p.width, p.height]} tag="h2" />
            )}
          />
        </section>
        <section aria-labelledby="t-more" className="wk">
          <div className="head col">
            <h2 data-ts="4" id="t-more">
              More projects
            </h2>
          </div>
          <Shelf
            cls="wb"
            items={smallerProjects}
            keyOf={p => p.id}
            label="t-more"
            render={p => <Plate h={8} id={`project-${p.id}`} p={p} size={[p.width, p.height]} />}
          />
        </section>
        <section aria-labelledby="t-clients" className="wk">
          <div className="head col">
            <h2 data-ts="4" id="t-clients">
              Client work
            </h2>
          </div>
          <Shelf
            cls="wc"
            items={clients}
            keyOf={c => c.id}
            label="t-clients"
            render={c =>
              c.image ? (
                <Plate cls="cl" h={8} id={`client-${c.id}`} p={c} size={[c.width, c.height]} />
              ) : (
                <TypePlate c={c} id={`client-${c.id}`} />
              )
            }
          />
        </section>
      </main>
    </Page>
  );
}
