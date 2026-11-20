// Guestbook: a letter-width page, the form as wells in the sheet, entries below. Signing posts the Netlify form; a new entry
// arrives at the top with one lamp left beside it.
import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from "react";

import type { Engine, PageCfg } from "../engine";
import { mq, RM } from "../engine/env";
import { fetchGuestEntries, safeWebsite, signGuestbook, type GuestEntry } from "../hooks/guestbook";
import { Label } from "../site/markup";
import { Page } from "../site/Page";
import { useEngine } from "../site/useEngine";

const CFG: PageCfg = { rest: [0.4, 0.28], gain: { wide: [0.25, 0.26], phone: [1.25, 0.27] } };
type Status = "ready" | "submitting" | "error" | "success" | "preview";
type Ready = RefObject<Promise<Engine | null>>;
function fieldText(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}
// the lamp beside a new entry: in the margin 56 px left of the name from 900 px, at the right end of the name line on a phone
// (none under prefers-contrast: more)
function lampBeside(k: Engine, a: Element) {
  const n = a.querySelector(".gb-name");
  if (!n || mq("(prefers-contrast: more)")) {
    return;
  }
  const r = n.getBoundingClientRect();
  const g = document.createRange();
  g.selectNodeContents(n);
  const x =
    window.innerWidth >= 900
      ? r.left - 56
      : Math.min(r.left + g.getBoundingClientRect().width + 24, window.innerWidth - 24);
  k.place(x + window.scrollX, r.top + r.height / 2 + window.scrollY);
}
function Spinner({ label, status = false }: { label: string; status?: boolean }) {
  return <span aria-label={label} className="spin" role={status ? "status" : "img"} />;
}
// Netlify detects the form by the static registration form in index.html (it rewrites that one at deploy); this one only posts
// its fields with form-name, so nothing inside the hydrated page is rewritten
function Form({ onSigned }: { onSigned: (entry: GuestEntry) => void }) {
  const [status, setStatus] = useState<Status>("ready");
  const busy = status === "submitting";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (import.meta.env.DEV) {
      setStatus("preview");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");
    try {
      await signGuestbook(form);
      form.reset();
      setStatus("success");
      onSigned({
        id: crypto.randomUUID(),
        name: fieldText(data, "name"),
        message: fieldText(data, "message"),
        website: safeWebsite(data.get("website")),
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    } catch {
      setStatus("error");
    }
  }
  const say: Partial<Record<Status, string>> = {
    success: "Thanks for signing!",
    error: "Couldn't save your entry. Try again.",
    preview: "Signing is available on the live site.",
  };
  return (
    <form
      className="gb-form"
      data-light="off"
      id="gb-form"
      method="POST"
      name="guestbook"
      onSubmit={event => {
        void submit(event);
      }}
    >
      <input name="form-name" type="hidden" value="guestbook" />
      <p hidden>
        <label>
          Leave this empty <input autoComplete="off" name="bot-field" tabIndex={-1} />
        </label>
      </p>
      <div className="pair">
        <label className="sr" htmlFor="guest-name">
          Your name
        </label>
        <input
          required
          autoComplete="name"
          className="field"
          disabled={busy}
          id="guest-name"
          maxLength={100}
          name="name"
          placeholder="your name"
        />
        <label className="sr" htmlFor="guest-website">
          Your site (optional)
        </label>
        <input
          autoComplete="url"
          className="field"
          disabled={busy}
          id="guest-website"
          maxLength={500}
          name="website"
          placeholder="your site (optional)"
          type="url"
        />
      </div>
      <label className="sr" htmlFor="guest-message">
        Message
      </label>
      <textarea
        required
        className="field"
        disabled={busy}
        id="guest-message"
        maxLength={4000}
        name="message"
        placeholder="say howdy..."
      />
      <div className="send">
        <button className="btn" disabled={busy} type="submit">
          <Label>Sign the guestbook</Label>
        </button>
        <div className="gb-status" id="gb-status" role="status">
          {busy ? <Spinner label="Submitting entry" /> : null}
          {say[status] ? <p>{say[status]}</p> : null}
        </div>
      </div>
    </form>
  );
}
function Entry({ v }: { v: GuestEntry }) {
  return (
    <article className="gb-entry">
      <h2 className="gb-name">
        {v.website ? (
          <a className="tl" href={v.website} rel="noopener noreferrer nofollow" target="_blank">
            {v.name}
          </a>
        ) : (
          v.name
        )}
      </h2>
      <p className="gb-msg">{v.message}</p>
      <p className="gb-date">{v.date}</p>
    </article>
  );
}
function Entries({
  state,
  entries,
  retry,
}: {
  state: "loading" | "error" | "ready";
  entries: GuestEntry[];
  retry: () => void;
}) {
  if (state === "loading") {
    return <Spinner status label="Loading entries" />;
  }
  const list = entries.map(v => <Entry key={v.id} v={v} />);
  if (state === "error") {
    return (
      <>
        <p className="gb-line">
          Couldn&apos;t load entries.{" "}
          <button className="tl tb" type="button" onClick={retry}>
            Retry
          </button>
        </p>
        {list}
      </>
    );
  }
  return entries.length ? list : <p className="gb-line">No entries yet.</p>;
}
// layout changes (entries arriving, the retry) start the fade of any lit lamp and re-measure; a new entry leaves one lamp beside it
function useLayoutHooks(
  engine: Ready,
  region: RefObject<HTMLDivElement | null>,
  key: string,
  signed: number
) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void engine.current.then(k => {
      k?.off();
      k?.relayout();
    });
  }, [engine, key]);
  useEffect(() => {
    const a = region.current?.querySelector(".gb-entry");
    if (!signed || !a) {
      return;
    }
    void engine.current.then(k => {
      if (k) {
        lampBeside(k, a);
      }
      if (!RM()) {
        a.animate(
          [
            { opacity: 0, transform: "translateY(12px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 330, easing: "cubic-bezier(.2, .8, .3, 1)" }
        );
      }
    });
  }, [engine, region, signed]);
}
export default function GuestbookPage() {
  const engine = useEngine(CFG);
  const region = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [retry, setRetry] = useState(0);
  const [signed, setSigned] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    fetchGuestEntries(controller.signal)
      .then(data => {
        if (!controller.signal.aborted) {
          setEntries(data);
          setState("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState("error");
        }
      });
    return () => {
      controller.abort();
    };
  }, [retry]);
  const onSigned = useCallback((entry: GuestEntry) => {
    setEntries(old => [entry, ...old]);
    setSigned(s => s + 1);
  }, []);
  useLayoutHooks(engine, region, `${state} ${String(entries.length)}`, signed);
  return (
    <Page current="Guestbook" id="p-guestbook" title="Guestbook">
      <main className="page" id="main" tabIndex={-1}>
        <div className="col">
          <div className="doc g-doc">
            <header className="phead">
              <h1 data-ts="5" tabIndex={-1}>
                Guestbook
              </h1>
            </header>
            <Form onSigned={onSigned} />
            <div
              ref={region}
              aria-busy={state === "loading"}
              aria-label="Guestbook entries"
              className="gb-entries"
              id="entries"
              role="region"
            >
              <Entries
                entries={entries}
                retry={() => {
                  setRetry(r => r + 1);
                }}
                state={state}
              />
            </div>
          </div>
        </div>
      </main>
    </Page>
  );
}
