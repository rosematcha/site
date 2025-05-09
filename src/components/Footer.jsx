// src/components/Footer.jsx
import React from "react";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <div style={{ textAlign: "center", color: "#ffb3da", fontSize: "0.95em", margin: "32px 0 12px 0" }}>
      &copy; {currentYear}
    </div>
  );
}

export default Footer;
