import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Section } from "../components/Section";
import { fetchGuestEntries, safeWebsite, signGuestbook, type GuestEntry } from "../hooks/guestbook";
import { usePageMeta } from "../hooks/usePageMeta";

function fieldText(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function GuestbookForm({ onSigned }: { onSigned: (entry: GuestEntry) => void }) {
  const [status, setStatus] = useState<"ready" | "submitting" | "error" | "success">("ready");
  const [previewOnly, setPreviewOnly] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (import.meta.env.DEV) {
      setPreviewOnly(true);
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");
    try {
      await signGuestbook(form);
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
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }
  return (
    <form
      className="guestbook-form"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      method="POST"
      name="guestbook"
      onSubmit={event => {
        void submit(event);
      }}
    >
      <input name="form-name" type="hidden" value="guestbook" />
      <p hidden>
        <label>
          Leave this empty
          <input autoComplete="off" name="bot-field" tabIndex={-1} />
        </label>
      </p>
      <div className="form-pair">
        <label className="sr-only" htmlFor="guest-name">
          Your name
        </label>
        <input
          required
          autoComplete="name"
          className="field"
          disabled={status === "submitting"}
          id="guest-name"
          maxLength={100}
          name="name"
          placeholder="your name"
        />
        <label className="sr-only" htmlFor="guest-website">
          Your site (optional)
        </label>
        <input
          autoComplete="url"
          className="field"
          disabled={status === "submitting"}
          id="guest-website"
          maxLength={500}
          name="website"
          placeholder="your site (optional)"
          type="url"
        />
      </div>
      <label className="sr-only" htmlFor="guest-message">
        Message
      </label>
      <textarea
        required
        className="field"
        disabled={status === "submitting"}
        id="guest-message"
        maxLength={4000}
        name="message"
        placeholder="say howdy..."
      />
      <button className="patch" disabled={status === "submitting"} type="submit">
        Sign the guestbook
      </button>
      <div role="status">
        {status === "submitting" && <span aria-label="Submitting entry" className="spinner" />}
        {status === "success" && <p>Thanks for signing!</p>}
        {status === "error" && <p>Couldn&apos;t save your entry. Try again.</p>}
        {previewOnly && <p>Signing is available on the live site.</p>}
      </div>
    </form>
  );
}
export default function GuestbookPage() {
  usePageMeta("Guestbook");
  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    void fetchGuestEntries(controller.signal)
      .then(data => {
        if (controller.signal.aborted) {
          return;
        }
        setEntries(data);
        setState("ready");
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
  }, []);
  return (
    <>
      <Section>
        <h1 tabIndex={-1}>Guestbook</h1>
        <GuestbookForm onSigned={onSigned} />
      </Section>
      <Section tone="deep">
        <div
          aria-busy={state === "loading"}
          aria-label="Guestbook entries"
          className="guestbook-results"
          role="region"
        >
          {state === "loading" && (
            <span aria-label="Loading entries" className="spinner" role="status" />
          )}
          {state === "error" && (
            <p>
              Couldn&apos;t load entries.{" "}
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setRetry(value => value + 1);
                }}
              >
                Retry
              </button>
            </p>
          )}
          {state === "ready" && entries.length === 0 && <p>No entries yet.</p>}
          {state !== "loading" &&
            entries.map(entry => (
              <article key={entry.id} className="guest-entry">
                <h2>
                  {entry.website ? (
                    <a href={entry.website} rel="noopener noreferrer nofollow" target="_blank">
                      {entry.name}
                    </a>
                  ) : (
                    entry.name
                  )}
                </h2>
                <div>
                  <p className="guest-message">{entry.message}</p>
                  <p className="guest-date">{entry.date}</p>
                </div>
              </article>
            ))}
        </div>
      </Section>
    </>
  );
}
