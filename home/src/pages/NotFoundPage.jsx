// src/pages/NotFoundPage.jsx
// The missing page as a literally torn-out scrap.
import React from "react";
import { Link } from "react-router-dom";
import OptimizedImage from "../components/OptimizedImage";

function NotFoundPage() {
  return (
    <div className="page-content" style={{ paddingTop: "var(--space-8)", textAlign: "center" }}>
      <div
        className="scrap scrap--deckle tilt-l"
        style={{ display: "inline-block", marginBottom: "var(--space-4)", maxWidth: "22rem" }}
      >
        <span className="tape" aria-hidden="true" style={{ left: "40%", top: "-0.7rem" }} />
        <div
          style={{
            color: "var(--rose-deep)",
            fontFamily: '"Young Serif", Georgia, serif',
            fontSize: "2.8rem",
            lineHeight: 1.1,
          }}
        >
          404
        </div>
        <OptimizedImage
          src="/img/404.gif"
          alt="Confused wandering around"
          loading="eager"
          decoding="async"
          style={{ display: "block", margin: "0.5rem auto", maxWidth: "200px", width: "100%" }}
        />
        <p style={{ fontSize: "var(--font-body)" }}>this page got torn out of the notebook.</p>
      </div>
      <div>
        <Link to="/" className="button tilt-r-sm">
          back to the front
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
