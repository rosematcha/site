// src/pages/GuestbookPage.jsx
// The wall: signatures become paper notes in four rotating stocks, stacked
// newest to oldest, each tilted a degree or two. The signing station is a
// taped scrap up top. Backend unchanged (Netlify Forms + function) until
// the Cloudflare move.
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./GuestbookPage.css";

const STOCKS = ["", "gb-sig--rose", "gb-sig--butter", "gb-sig--mint"];
const TILTS = [-1, 1.3, -0.5, 0.8];

function GuestbookPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState(null); // null, 'submitting', 'success', 'error'
  const [entries, setEntries] = useState([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [shake, setShake] = useState(false);

  const fetchEntries = useCallback(async () => {
    setIsLoadingEntries(true);
    setFetchError(null);
    try {
      const response = await fetch("/.netlify/functions/get-guestbook-entries");
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("the wall isn't reachable right now");
      }
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error("[Guestbook] Error fetching entries:", error);
      setFetchError("The wall isn't reachable right now. Try again in a bit.");
      setEntries([]);
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleInvalid = () => {
    setShake(false);
    requestAnimationFrame(() => setShake(true));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSubmissionStatus("submitting");
    const formData = new FormData(event.target);

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      if (response.ok) {
        setSubmissionStatus("success");
        const newEntry = {
          id: `optimistic-${Date.now()}`,
          name,
          website,
          message,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          fresh: true,
        };
        setEntries(prev => [newEntry, ...prev]);
        setName("");
        setMessage("");
        setWebsite("");
        setTimeout(() => setSubmissionStatus(null), 3000);
      } else {
        const errorText = await response.text();
        console.error("[Guestbook] Form submission HTTP error:", response.status, errorText);
        setSubmissionStatus("error");
      }
    } catch (error) {
      console.error("[Guestbook] Form submission network/JS error:", error);
      setSubmissionStatus("error");
    }
  };

  return (
    <div className="page-content guestbook">
      <form
        name="guestbook"
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
        onInvalid={handleInvalid}
        className={`guestbook-station scrap scrap--deckle tilt-l-sm ${shake ? "is-shaking" : ""}`}
        onAnimationEnd={() => setShake(false)}
      >
        <span className="tape" aria-hidden="true" />
        <input type="hidden" name="form-name" value="guestbook" />
        <p className="visually-hidden">
          <label>
            Don’t fill this out if you’re human: <input name="bot-field" />
          </label>
        </p>

        <div className="guestbook-station__row">
          <label className="visually-hidden" htmlFor="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="your name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={submissionStatus === "submitting"}
          />
          <label className="visually-hidden" htmlFor="website">
            Website (optional)
          </label>
          <input
            type="url"
            id="website"
            name="website"
            placeholder="your site (optional)"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            disabled={submissionStatus === "submitting"}
          />
          <label className="visually-hidden" htmlFor="message">
            Message
          </label>
          <input
            type="text"
            id="message"
            name="message"
            placeholder="say howdy…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            disabled={submissionStatus === "submitting"}
          />
          <button
            type="submit"
            className="button button--butter"
            disabled={submissionStatus === "submitting"}
          >
            {submissionStatus === "submitting" ? "signing…" : "sign it ✿"}
          </button>
        </div>
        <div className="mono-meta guestbook-station__hint">
          no account, no email, no moderation queue. just say hi.
        </div>

        {submissionStatus === "success" && (
          <p className="guestbook-station__ok">
            Thanks for signing! Your note just joined the wall.
          </p>
        )}
        {submissionStatus === "error" && (
          <p className="guestbook-station__err">
            Something went wrong with your post. Please try again.
          </p>
        )}
      </form>

      {isLoadingEntries && <p className="guestbook__status scrap">Loading the wall…</p>}
      {fetchError && (
        <p className="guestbook__status guestbook__status--error scrap">{fetchError}</p>
      )}
      {!isLoadingEntries && !fetchError && entries.length > 0 && (
        <>
          <div className="mono-meta guestbook__tally">
            {entries.length} signature{entries.length === 1 ? "" : "s"} on the wall
          </div>
          <div className="guestbook-wall">
            {entries.map((entry, index) => (
              <article
                key={entry.id}
                className={`gb-sig scrap ${STOCKS[index % STOCKS.length]} ${entry.fresh ? "gb-sig--fresh" : ""}`}
                style={{ "--sig-tilt": `${TILTS[index % TILTS.length]}deg` }}
              >
                <p className="gb-sig__message">{entry.message}</p>
                <div className="mono-meta gb-sig__meta">
                  <span>
                    {entry.website ? (
                      <a
                        href={entry.website}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                      >
                        {entry.name}
                      </a>
                    ) : (
                      entry.name
                    )}
                  </span>
                  <time>{entry.date}</time>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {!isLoadingEntries && !fetchError && entries.length === 0 && (
        <p className="guestbook__status">No messages yet. Be the first on the wall.</p>
      )}

      <div className="guestbook__back">
        <Link to="/" className="link-swipe">
          ← back home
        </Link>
      </div>
    </div>
  );
}

export default GuestbookPage;
