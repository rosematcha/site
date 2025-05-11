// src/components/Footer.jsx
import React, { useEffect, useRef, useState } from "react";
import quotes from "../assets/quotes";
import "./Footer.css";

function getRandomQuote(lastIndex) {
  let idx;
  do {
    idx = Math.floor(Math.random() * quotes.length);
  } while (quotes.length > 1 && idx === lastIndex);
  return idx;
}

function Footer() {
  const currentYear = new Date().getFullYear();
  const marqueeRef = useRef(null);
  const [quoteIndex, setQuoteIndex] = useState(() => getRandomQuote(-1));
  const lastIndexRef = useRef(quoteIndex);

  // Change quote when marquee scrolls out of view
  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;
    // Handler for when the marquee finishes scrolling
    const handleMarquee = () => {
      const newIdx = getRandomQuote(lastIndexRef.current);
      lastIndexRef.current = newIdx;
      setQuoteIndex(newIdx);
    };
    // <marquee> fires onfinish when the scroll completes and restarts
    marquee.onfinish = handleMarquee;
    marquee.onbounce = handleMarquee;
    // Remove timer fallback: only change quote when marquee finishes
    return () => {
      marquee.onfinish = null;
      marquee.onbounce = null;
    };
  }, []);

  function renderQuote(text) {
    return <><span role="img" aria-label="sparkle">✨</span> {text} <span role="img" aria-label="sparkle">✨</span></>;
  }

  return (
    <>
      <div className="custom-marquee-container" style={{ marginBottom: "10px" }}>
        <marquee
          behavior="scroll"
          direction="left"
          scrollAmount="4"
          className="custom-marquee-text"
          ref={marqueeRef}
        >
          {renderQuote(quotes[quoteIndex])}
        </marquee>
      </div>
      <div style={{ textAlign: "center", color: "#ffb3da", fontSize: "0.95em", margin: "32px 0 12px 0" }}>
        &copy; {currentYear}
      </div>
    </>
  );
}

export default Footer;
