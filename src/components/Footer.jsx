// src/components/Footer.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import quotes from "../assets/quotes";

function getRandomQuote(lastIndex) {
  let idx;
  do {
    idx = Math.floor(Math.random() * quotes.length);
  } while (quotes.length > 1 && idx === lastIndex);
  return idx;
}

const MARQUEE_SPEED = 80; // px per second (adjust for desired speed)

function Footer() {
  const currentYear = new Date().getFullYear();
  const [quoteIndex, setQuoteIndex] = useState(() => getRandomQuote(-1));
  const lastIndexRef = useRef(quoteIndex);
  const textRef = useRef(null);
  const [animKey, setAnimKey] = useState(0);
  const [duration, setDuration] = useState(0);

  function renderQuote(text) {
    return <><span role="img" aria-label="sparkle">✨</span> {text} <span role="img" aria-label="sparkle">✨</span></>;
  }

  // Calculate animation duration based on text width
  const setupAnimation = useCallback(() => {
    const textEl = textRef.current;
    if (!textEl) return;
    const container = textEl.parentElement;
    if (!container) return;
    const textWidth = textEl.offsetWidth;
    const containerWidth = container.offsetWidth;
    // Distance to travel: textWidth + containerWidth
    const distance = textWidth + containerWidth;
    const newDuration = distance / MARQUEE_SPEED;
    setDuration(newDuration);
    setAnimKey((k) => k + 1); // force re-render to restart animation
  }, []);

  // When quote changes, recalc duration and restart
  useEffect(() => {
    setupAnimation();
    // eslint-disable-next-line
  }, [quoteIndex]);

  // On window resize, recalc duration
  useEffect(() => {
    window.addEventListener("resize", setupAnimation);
    return () => window.removeEventListener("resize", setupAnimation);
  }, [setupAnimation]);

  // When animation ends, pick a new quote
  const handleAnimationEnd = () => {
    const newIdx = getRandomQuote(lastIndexRef.current);
    lastIndexRef.current = newIdx;
    setQuoteIndex(newIdx);
  };

  return (
    <>
      <div className="custom-marquee-container" style={{ overflow: "hidden", position: "relative", width: "100%" }}>
        <div
          key={animKey}
          ref={textRef}
          className="custom-marquee-text"
          style={{
            position: "absolute",
            left: "100%",
            whiteSpace: "nowrap",
            willChange: "transform",
            animation: duration
              ? `marquee-scroll ${duration}s linear 1`
              : undefined,
          }}
          onAnimationEnd={handleAnimationEnd}
        >
          {renderQuote(quotes[quoteIndex])}
        </div>
      </div>
      <div style={{ textAlign: "center", color: "#ffb3da", fontSize: "0.95em", margin: "10px 20px 20px 20px" }}>
        &copy; {currentYear}
      </div>
    </>
  );
}

export default Footer;
// Add this to your CSS (index.css):
// @keyframes marquee-scroll {
//   0% { transform: translateX(0); }
//   100% { transform: translateX(-100%); }
// }
