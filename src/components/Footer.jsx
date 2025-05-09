// src/components/Footer.jsx
import React from "react";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="main-footer">
      <p>
        &copy; {currentYear}
      </p>
      {/* Visitor counter image */}
      <img src="/img/visitor_counter.gif" alt="99999 Visitors!" width="80" />
      <p>
        <img src="/img/netscape_now.gif" alt="Get Netscape Now!" />
        <img src="/img/ie_now.gif" alt="Get Internet Explorer Now!" />
      </p>
    </footer>
  );
}

export default Footer;
