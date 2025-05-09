// src/pages/GuestbookPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./PageStyles.css";
import "./GuestbookPage.css";

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
        "/.netlify/functions/get-guestbook-entries", // <<< THIS IS THE CORRECT FETCH URL
      );
      if (!response.ok) {
        const errorData = await response.json(); // Attempt to parse error response as JSON
        throw new Error(
          errorData.error || `Server error: ${response.statusText} (Status: ${response.status})`,
        );
      }
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error("Error fetching guestbook entries:", error);
      setFetchError(error.message);
      setEntries([]); // Optionally clear entries or show a persistent error
    } finally {
      setIsLoadingEntries(false);
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]); // Depend on fetchEntries

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmissionStatus("submitting");
    const formData = new FormData(event.target);

    try {
      const response = await fetch("/", { // Submit to Netlify Forms endpoint
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      if (response.ok) {
        setSubmissionStatus("success");
        setName("");
        setMessage("");
        setWebsite("");
        // Re-fetch entries after a short delay to allow Netlify to process
        setTimeout(() => {
          fetchEntries(); // <<< RE-FETCH ENTRIES
          setSubmissionStatus(null); // Reset status after a bit
        }, 2500); // Adjust delay if needed
      } else {
        const errorText = await response.text();
        console.error("Form submission HTTP error:", response.status, errorText);
        setSubmissionStatus("error");
      }
    } catch (error) {
      console.error("Form submission network/JS error:", error);
      setSubmissionStatus("error");
    }
  };

  return (
    <div className="page-content guestbook-container">
      <div style={{ textAlign: "center" }}>
        <img
          src="/img/sign_my_guestbook.gif"
          alt="Sign My Guestbook!"
          style={{ marginBottom: "15px", maxWidth: "200px" }}
        />
      </div>
      <h2>Sign the Guestbook!</h2>

      <form
        name="guestbook"
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
        className="guestbook-form"
      >
        <input type="hidden" name="form-name" value="guestbook" />
        <p className="hidden-field" style={{ display: "none" }}>
          <label>
            Don’t fill this out if you’re human: <input name="bot-field" />
          </label>
        </p>

        <div className="form-group">
          <label htmlFor="name">Your Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submissionStatus === "submitting"}
          />
        </div>
        <div className="form-group">
          <label htmlFor="website">Your Website (Optional):</label>
          <input
            type="url"
            id="website"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.example.com"
            disabled={submissionStatus === "submitting"}
          />
        </div>
        <div className="form-group">
          <label htmlFor="message">Your Message:</label>
          <textarea
            id="message"
            name="message"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={submissionStatus === "submitting"}
          ></textarea>
        </div>
        <button
          type="submit"
          className="submit-button"
          disabled={submissionStatus === "submitting"}
        >
          {submissionStatus === "submitting" ? (
            "Posting..."
          ) : (
            <>
              <img
                src="/img/submit_button_pixel.gif"
                alt="Submit"
                style={{ verticalAlign: "middle", marginRight: "5px" }}
              />
              Post Message
            </>
          )}
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

      <hr className="guestbook-divider" />

      <h3>What Others Have Said...</h3>
      {isLoadingEntries && <p>Loading awesome messages...</p>}
      {fetchError && (
        <p className="error-message">
          Could not load messages: {fetchError} <br /> (This might be because the Form ID or API Token isn't set up on Netlify yet, or the form hasn't received submissions.)
        </p>
      )}
      {!isLoadingEntries && !fetchError && entries.length > 0 && (
        <div className="guestbook-entries">
          {entries.map((entry) => (
            <div key={entry.id} className="guestbook-entry">
              <p className="entry-meta">
                <strong>From:</strong> {entry.name}
                {entry.website && (
                  <>
                    {" | "}
                    <a
                      href={entry.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      title={entry.website}
                    >
                      {entry.website.replace(/^https?:\/\//, "")}
                    </a>
                  </>
                )}
                <br />
                <strong>Date:</strong> {entry.date}
              </p>
              <p className="entry-message">{entry.message}</p>
            </div>
          ))}
        </div>
      )}
      {!isLoadingEntries && !fetchError && entries.length === 0 && (
        <p>No messages yet. Womp womp.</p>
      )}

      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <Link to="/" className="geocities-button">
          <img
            src="/img/back_button.gif"
            alt="Back to Home"
            style={{ verticalAlign: "middle", marginRight: "5px" }}
          />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default GuestbookPage;
