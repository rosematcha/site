// src/pages/NotFoundPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./PageStyles.css";

function NotFoundPage() {
  return (
    <div className="page-content text-center">
      <div className="intro-image-container text-center mt-0 mb-3">
        <img
          src="/img/404.gif"
          alt="Haruhi Suzumiya hitting Kyon on the head"
          className="intro-gif"
        />
      </div>
      <p className="text-center">whoops! either something went wrong or this page doesn't exist.</p>

      <div className="mt-8">
        <Link to="/" className="button">
          <img
            src="/img/back_button.gif"
            alt="Back to Home"
            className="icon-inline mr-2"
          />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
