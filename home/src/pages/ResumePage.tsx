// Resume: one centred document, dates beside roles. The experience filter (lenses, from ?lens=) and search change only the roles;
// lit lamps start their fade when the roles change, and the directory's notes show on hover or focus from 680 px.
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { clients, featuredProjects, smallerProjects } from "../data/portfolio";
import { jobs, skills, type Job } from "../data/resume";
import type { PageCfg } from "../engine";
import { RM } from "../engine/env";
import { Label, To } from "../site/markup";
import { Page } from "../site/Page";
import { useEngine } from "../site/useEngine";

import { initNotes } from "./notes";

const CFG: PageCfg = { rest: [0.4, 0.28], gain: { wide: [0.25, 0.26], phone: [1.25, 0.27] } };
const LENSES: [string, string][] = [
  ["sysadmin", "Sysadmin"],
  ["web", "Web"],
  ["arts", "Arts + ed"],
  ["all", "All"],
];
const noop = () => () => undefined;
const known = (v: string | null) => (LENSES.some(([id]) => id === v) && v ? v : "all");
const findOf = (j: Job) => [j.title, j.company, ...j.tags, ...j.details].join(" ").toLowerCase();
// Work's order: home's four, San Japan, then the smaller projects; clients in data order
const PROJECTS = [...featuredProjects, ...smallerProjects];

// hits are marked in titles, companies, details and skill items; each keeps its own text
function marked(text: string, q: string): ReactNode {
  if (!q) {
    return text;
  }
  const out: ReactNode[] = [];
  const low = text.toLowerCase();
  let at = 0;
  for (let i = low.indexOf(q); i >= 0; i = low.indexOf(q, at)) {
    out.push(text.slice(at, i), <mark key={i}>{text.slice(i, i + q.length)}</mark>);
    at = i + q.length;
  }
  out.push(text.slice(at));
  return out;
}
function shown(j: Job, lens: string, q: string) {
  return q ? findOf(j).includes(q) : lens === "all" || j.lenses.includes(lens);
}
function Role({ j, q, hidden }: { j: Job; q: string; hidden: boolean }) {
  return (
    <article className="role" hidden={hidden}>
      <p className="dates">
        {j.start} – {j.end ?? "present"}
      </p>
      <div className="rb">
        <h3>{marked(j.title, q)}</h3>
        <p className="co">{marked(j.company, q)}</p>
        <ul>
          {j.details.map(d => (
            <li key={d}>{marked(d, q)}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
function Dir({
  items,
  kind,
  action,
}: {
  items: { id: string; title: string; description: string }[];
  kind: string;
  action: string;
}) {
  return (
    <ul className="dir">
      {items.map(c => (
        <li key={c.id}>
          <Link
            className="tl"
            data-action={action}
            data-note={c.description}
            to={`/work#${kind}-${c.id}`}
          >
            {c.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
function Tools({
  lens,
  q,
  onLens,
  onSearch,
}: {
  lens: string;
  q: string;
  onLens: (id: string) => void;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="tools" data-light="off">
      <div aria-label="Experience filter" className="lenses" role="group">
        {LENSES.map(([id, label]) => {
          const on = !q && id === lens;
          return (
            <button
              key={id}
              aria-pressed={on}
              className="btn tog"
              type="button"
              onClick={() => {
                onLens(id);
              }}
            >
              <span className="obj" data-h={on ? 2 : 5}>
                <span className="face">
                  <span className="label">{label}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <input
        aria-label="Search resume"
        autoComplete="off"
        className="field search"
        id="r-search"
        placeholder="search skills, tools..."
        type="search"
        value={q}
        onChange={e => {
          onSearch(e.target.value);
        }}
      />
    </div>
  );
}
export default function ResumePage() {
  const engine = useEngine(CFG);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // the built page is All; a ?lens= applies right after hydration (the first client render matches the built markup)
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
  const lens = hydrated ? known(params.get("lens")) : "all";
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const n = jobs.filter(j => shown(j, lens, q)).length;
  const list = useRef<HTMLDivElement>(null);
  const last = useRef(n);
  const changed = useRef(false);
  // the kit hears about layout changes: lit lamps start their fade when the roles change, and everything is measured again
  useLayoutEffect(() => {
    if (!changed.current) {
      return;
    }
    const moved = n !== last.current;
    if (moved && !RM()) {
      list.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "linear" });
    }
    void engine.current.then(k => {
      if (moved) {
        k?.off();
      }
      k?.relayout();
    });
    last.current = n;
  }, [n, lens, q, engine]);
  useEffect(() => {
    void engine.current.then(k => {
      if (k) {
        initNotes(k, to => {
          void navigate(to);
        });
      }
    });
  }, [engine, navigate]);
  const pick = (id: string) => {
    changed.current = true;
    setQuery("");
    setParams(
      p => {
        p.set("lens", id);
        return p;
      },
      { replace: true, preventScrollReset: true }
    );
  };
  return (
    <Page current="Resume" id="p-resume" title="Resume">
      <main className="page" id="main" tabIndex={-1}>
        <div className="col">
          <div className="doc r-doc">
            <header className="phead r-head">
              <h1 data-ts="5" tabIndex={-1}>
                Reese Lundquist
              </h1>
              <p className="role-line">
                Developer · systems administrator · photographer · organizer · teacher
              </p>
              <p className="where-line">
                San Antonio, TX · available locally or remote · open to freelance
              </p>
              <div className="links">
                <To className="tl" to="mailto:howdy@rosematcha.com">
                  howdy@rosematcha.com
                </To>
                <To className="tl" to="https://github.com/rosematcha">
                  github.com/rosematcha
                </To>
                <button
                  className="btn pdf"
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <Label>Print / PDF</Label>
                </button>
                <span className="print-site">rosematcha.com</span>
              </div>
            </header>
            <section aria-labelledby="t-exp" className="r-exp">
              <h2 data-ts="4" id="t-exp">
                Experience
              </h2>
              <Tools
                lens={lens}
                q={q}
                onLens={pick}
                onSearch={v => {
                  changed.current = true;
                  setQuery(v);
                }}
              />
              <p className="sr" id="r-count" role="status">
                {n} of {jobs.length} roles
              </p>
              <div ref={list} className="roles">
                {jobs.map(j => (
                  <Role key={`${j.title} ${j.company}`} hidden={!shown(j, lens, q)} j={j} q={q} />
                ))}
                <p className="none" hidden={n > 0} role="status">
                  No roles match.
                </p>
              </div>
            </section>
            <div className="r-dirs">
              <section aria-labelledby="t-cl">
                <h2 data-ts="4" id="t-cl">
                  Client work
                </h2>
                <Dir action="View client work" items={clients} kind="client" />
              </section>
              <section aria-labelledby="t-pj">
                <h2 data-ts="4" id="t-pj">
                  Personal projects
                </h2>
                <Dir action="View project" items={PROJECTS} kind="project" />
              </section>
            </div>
            <section aria-labelledby="t-sk" className="r-skills">
              <h2 data-ts="4" id="t-sk">
                Skills
              </h2>
              <dl>
                {skills.map(g => (
                  <div key={g.label}>
                    <dt>{g.label}</dt>
                    <dd>
                      {g.items.map((item, i) => (
                        <Fragment key={item}>
                          {i ? ", " : ""}
                          <span>{marked(item, q)}</span>
                        </Fragment>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section aria-labelledby="t-ed" className="r-edu">
              <h2 data-ts="4" id="t-ed">
                Education
              </h2>
              <p>
                <strong>Associate of Science, Computer Science</strong>
                <br />
                Northwest Vista College, San Antonio TX, 2023
              </p>
            </section>
          </div>
        </div>
        <div hidden className="note" data-light="off" id="contribution-note">
          <span className="obj" data-h="10">
            <span className="face">
              <p className="note-d" />
              <a className="tl note-a" href={`/work#client-${clients[0]?.id ?? ""}`}>
                {" "}
              </a>
            </span>
          </span>
        </div>
      </main>
    </Page>
  );
}
