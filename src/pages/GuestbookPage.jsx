// src/pages/GuestbookPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./PageStyles.css"; // Common page styles
import "./GuestbookPage.css"; // Specific styles for the guestbook

function GuestbookPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // Classic guestbook field!
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [entries, setEntries] = useState([]);

  // Fetch entries from our static JSON file
  useEffect(() => {
    fetch("/data/guestbook-entries.json") // We'll create this file
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setEntries(data))
      .catch((error) =>
        console.error("Error fetching guestbook entries:", error),
      );
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    try {
      const response = await fetch("/", {
        // Netlify handles submissions to the root path if form is set up correctly
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      if (response.ok) {
        setSubmissionStatus("success");
        setName("");
        setMessage("");
        setWebsite("");
        // Note: New entries won't appear immediately with the static JSON method.
        // You'd need to manually update guestbook-entries.json and redeploy,
        // or implement dynamic fetching (Option B).
      } else {
        setSubmissionStatus("error");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmissionStatus("error");
    }
  };

  return (
    <div className="page-content guestbook-container">
      <div style={{ textAlign: "center" }}>
        <img
          src="/img/sign_my_guestbook.gif" // Find a "Sign My Guestbook!" GIF
          alt="Sign My Guestbook!"
          style={{ marginBottom: "15px", maxWidth: "200px" }}
        />
      </div>
      

      <form
        name="guestbook" // This name is important for Netlify
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field" // Spam prevention
        onSubmit={handleSubmit}
        className="guestbook-form"
      >
        {/* Hidden input for Netlify to identify the form */}
        <input type="hidden" name="form-name" value="guestbook" />
        {/* Honeypot field for spam (should be hidden by CSS) */}
        <p className="hidden-field">
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
            placeholder="http://www.example.com"
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
          ></textarea>
        </div>
        <button type="submit" className="submit-button">
          <img
            src="/img/submit_button_pixel.gif" // Find a cute submit button GIF
            alt="Submit"
            style={{ verticalAlign: "middle", marginRight: "5px" }}
          />
          Post Message
        </button>

        {submissionStatus === "success" && (
          <p className="success-message">
            Thanks for signing! Your message is awaiting its grand debut (after
            a quick check!).
          </p>
        )}
        {submissionStatus === "error" && (
          <p className="error-message">
            Oops! Something went wrong. Please try again.
          </p>
        )}
      </form>

      <hr className="guestbook-divider" />

      <h3>What Others Have Said...</h3>
      {entries.length > 0 ? (
        <div className="guestbook-entries">
        {entries.map((entry, index) => (
        <div key={index} className="guestbook-entry">
            <p className="entry-meta">
            <strong>From:</strong> {entry.name}
            {entry.website && (
                <>
                {" | "}
                <a
                    href={entry.website} // The href remains the same
                    target="_blank"
                    rel="noopener noreferrer"
                    title={entry.website} // Optional: add a title attribute for full URL on hover
                >
                    {/* Change this line to display the URL itself */}
                    {entry.website.replace(/^https?:\/\//, '')} {/* Display URL, optionally strip http(s):// */}
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
      ) : (
        <p>Be the first to sign the guestbook!</p>
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
