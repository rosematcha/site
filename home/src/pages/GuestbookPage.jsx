import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import "./GuestbookPage.css";

const NOTE_TONES = ["", "gb-note--rose", "", "gb-note--matcha", ""];

function GuestbookPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState(null); // null, 'submitting', 'success', 'error'
  const [entries, setEntries] = useState([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Use useCallback to memoize fetchEntries
  const fetchEntries = useCallback(async () => {
    setIsLoadingEntries(true);
    setFetchError(null);
    try {
      // The path to your Netlify Function
      const response = await fetch(
        "/.netlify/functions/get-guestbook-entries" // <<< THIS IS THE CORRECT FETCH URL
      );
      if (!response.ok) {
        const errorData = await response.json(); // Attempt to parse error response as JSON
        throw new Error(
          errorData.error || `Server error: ${response.statusText} (Status: ${response.status})`
        );
      }
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error("[Guestbook] Error fetching entries:", error);
      setFetchError(error.message);
      setEntries([]); // Optionally clear entries or show a persistent error
    } finally {
      setIsLoadingEntries(false);
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]); // Depend on fetchEntries

  const handleSubmit = async event => {
    event.preventDefault();
    setSubmissionStatus("submitting");
    const formData = new FormData(event.target);

    try {
      const response = await fetch("/", {
        // Submit to Netlify Forms endpoint
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      if (response.ok) {
        setSubmissionStatus("success");
        // Optimistically prepend the new entry so it's visible immediately
        const newEntry = {
          id: `optimistic-${Date.now()}`,
          name,
          website,
          message,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
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
      <header className="guestbook__head">
        <h2>Guestbook</h2>
        <p>Leave a note, say hi, drop a link.</p>
      </header>

      <form
        name="guestbook"
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
        className="guestbook-form"
      >
        <input type="hidden" name="form-name" value="guestbook" />
        <p className="hidden visually-hidden">
          <label>
            Don’t fill this out if you’re human: <input name="bot-field" />
          </label>
        </p>

        <div className="guestbook-form__fields">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={submissionStatus === "submitting"}
            />
          </div>
          <div className="form-group">
            <label htmlFor="website">
              Website <span className="form-group__optional">optional</span>
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://www.example.com"
              disabled={submissionStatus === "submitting"}
            />
          </div>
          <div className="form-group form-group--message">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows="2"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              disabled={submissionStatus === "submitting"}
            ></textarea>
          </div>
        </div>
        <button type="submit" className="button" disabled={submissionStatus === "submitting"}>
          <Send size={18} />
          {submissionStatus === "submitting" ? "Signing..." : "Sign the guestbook"}
        </button>

        {submissionStatus === "success" && (
          <p className="success-message">
            Thanks for signing! Your message should appear below shortly.
          </p>
        )}
        {submissionStatus === "error" && (
          <p className="error-message">
            Oops! Something went wrong with your post. Please try again.
          </p>
        )}
      </form>

      {isLoadingEntries && <p className="guestbook__status">Loading awesome messages...</p>}
      {fetchError && (
        <p className="error-message">
          Could not load messages: {fetchError} <br /> (This might be because the Form ID or API
          Token isn't set up on Netlify yet, or the form hasn't received submissions.)
        </p>
      )}
      {!isLoadingEntries && !fetchError && entries.length > 0 && (
        <div className="guestbook-wall">
          {entries.map((entry, index) => (
            <article key={entry.id} className={`gb-note ${NOTE_TONES[index % NOTE_TONES.length]}`}>
              <p className="gb-note__message">{entry.message}</p>
              <div className="gb-note__meta">
                <span className="gb-note__name">{entry.name}</span>
                {entry.website && (
                  <a
                    href={entry.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    title={entry.website}
                  >
                    {entry.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <span className="gb-note__date">{entry.date}</span>
              </div>
            </article>
          ))}
        </div>
      )}
      {!isLoadingEntries && !fetchError && entries.length === 0 && (
        <p className="guestbook__status">No messages yet. Womp womp.</p>
      )}

      <div className="text-center mt-7">
        <Link to="/" className="button button--ghost">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default GuestbookPage;
