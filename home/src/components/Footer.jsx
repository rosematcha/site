// src/components/Footer.jsx
// The quote marquee: every quote on a slow loop, so returning visitors
// eventually meet the whole list. Track is duplicated for a seamless wrap;
// the copy is aria-hidden so screen readers hear each quote once.
import React from "react";
import quotes from "../data/quotes";

const SEPARATOR = " ✿ ";

function Footer() {
  const line = quotes.map(q => `“${q}”`).join(SEPARATOR) + SEPARATOR;

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-marquee marquee">
        <span className="marquee__track">
          <span>{line}</span>
          <span aria-hidden="true">{line}</span>
        </span>
      </div>
      <div className="footer-under">
        <div className="footer-copyright">
          © {new Date().getFullYear()} Reese Lundquist · San Antonio, TX
        </div>
        <a className="mono-meta link-swipe" href="mailto:howdy@rosematcha.com">
          howdy@rosematcha.com
        </a>
      </div>
    </footer>
  );
}

export default Footer;
