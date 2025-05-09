// src/components/Footer.jsx
import React, { useEffect, useRef, useState } from "react";
import quotes from "../assets/quotes";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const marqueeRef = useRef(null);
  const [quoteIndex, setQuoteIndex] = useState(() => getRandomQuote(-1));
  const lastIndexRef = useRef(quoteIndex);

  // Change quote when marquee scrolls out of view
  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;
    // Listen for animation iteration (marquee restart)
    const handleMarquee = () => {
      const newIdx = getRandomQuote(lastIndexRef.current);
      lastIndexRef.current = newIdx;
      setQuoteIndex(newIdx);
    };
    // <marquee> doesn't support animationiteration, so use onend/onfinish/onbounce and a timer fallback
    marquee.onfinish = handleMarquee;
    marquee.onbounce = handleMarquee;
    // Timer fallback: recalculate duration and set interval
    let intervalId;
    const setMarqueeInterval = () => {
      // Estimate duration based on scrollAmount and text length
      const scrollAmount = parseInt(marquee.getAttribute('scrollamount')) || 4;
      const textLength = marquee.textContent.length;
      // Rough estimate: higher scrollAmount = faster, so shorter duration
      const duration = Math.max(3000, (textLength * 80) / scrollAmount); // min 3s
      intervalId = setInterval(handleMarquee, duration);
    };
    setMarqueeInterval();
    // Clean up
    return () => {
      marquee.onfinish = null;
      marquee.onbounce = null;
      clearInterval(intervalId);
    };
  }, [location]);

  // Ensure quote changes on route change (pagination)
  useEffect(() => {
    const newIdx = getRandomQuote(lastIndexRef.current);
    lastIndexRef.current = newIdx;
    setQuoteIndex(newIdx);
  }, [location]);

  // Render the quote, with special handling for the guestbook link
  function renderQuote(text) {
    if (text.toLowerCase().includes("guestbook")) {
      const [before, after] = text.split(/guestbook/i);
      return <><span role="img" aria-label="sparkle">✨</span> {before}<Link to="/guestbook">Guestbook</Link>{after && after.replace(/!/, "!")} <span role="img" aria-label="sparkle">✨</span></>;
    }
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
