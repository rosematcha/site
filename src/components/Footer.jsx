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
  const containerRef = useRef(null);
  const [animKey, setAnimKey] = useState(0);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);

  function renderQuote(text) {
    return <><span role="img" aria-label="sparkle">✨</span> {text} <span role="img" aria-label="sparkle">✨</span></>;
  }

  // Calculate animation duration and distance based on text width
  const setupAnimation = useCallback(() => {
    const textEl = textRef.current;
    const container = containerRef.current;
    if (!textEl || !container) return;
    const textWidth = textEl.offsetWidth;
    const containerWidth = container.offsetWidth;
    // Distance to travel: textWidth + containerWidth
    const totalDistance = textWidth + containerWidth;
    const newDuration = totalDistance / MARQUEE_SPEED;
    setDuration(newDuration);
    setDistance(totalDistance);
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
      <div
        className="custom-marquee-container"
        ref={containerRef}
        style={{ minHeight: 20 }}
      >
        <div
          key={animKey}
          ref={textRef}
          className="custom-marquee-text"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            whiteSpace: "nowrap",
            willChange: "transform",
            animation: duration && distance
              ? `marquee-scroll-px ${duration}s linear 1`
              : undefined,
            // Custom property for dynamic distance
            ['--marquee-distance']: distance ? `-${distance}px` : undefined,
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
