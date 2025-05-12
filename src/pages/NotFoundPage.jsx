// src/pages/NotFoundPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./PageStyles.css";

function NotFoundPage() {
  return (
    <div className="page-content" style={{ textAlign: "center" }}>
      <div className="intro-image-container" style={{ textAlign: 'center', marginTop: '0', marginBottom: '25px' }}>
        <img
          src="/img/404.gif"
          alt="Haruhi Suzumiya hitting Kyon on the head"
          className="intro-gif"
        />
      </div>
      <p>whoops! either something went wrong or this page doesn't exist.</p>

      <div style={{ marginTop: '40px' }}>
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

export default NotFoundPage;
