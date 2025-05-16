// src/components/Footer.jsx
import React, { useRef, useState, useEffect } from "react";
import quotes from "../assets/quotes";

function getRandomQuote(lastIndex) {
  let idx;
  do {
    idx = Math.floor(Math.random() * quotes.length);
  } while (quotes.length > 1 && idx === lastIndex);
  return idx;
}

function Footer() {
  const currentYear = new Date().getFullYear();
  const [quoteIndex, setQuoteIndex] = useState(() => getRandomQuote(-1));
  const lastIndexRef = useRef(quoteIndex);
  const [resetAnim, setResetAnim] = useState(false);
  const marqueeInnerRef = useRef(null);

  function renderQuote(text) {
    return <><span role="img" aria-label="sparkle">✨</span> {text} <span role="img" aria-label="sparkle">✨</span></>;
  }

  // When animation ends, pick a new quote and restart
  useEffect(() => {
    const handleAnimationEnd = () => {
      // Reset animation
      setResetAnim(true);
      setTimeout(() => {
        setQuoteIndex((prev) => {
          const newIdx = getRandomQuote(lastIndexRef.current);
          lastIndexRef.current = newIdx;
          return newIdx;
        });
        setResetAnim(false);
      }, 20); // Small delay to allow animation reset
    };
    const el = marqueeInnerRef.current;
    if (el) {
      el.addEventListener("animationend", handleAnimationEnd);
    }
    return () => {
      if (el) el.removeEventListener("animationend", handleAnimationEnd);
    };
  }, []);

  return (
    <>
      <div className="custom-marquee-container" style={{ overflow: "hidden", width: "100%" }}>
        <div
          ref={marqueeInnerRef}
          className={`custom-marquee-text marquee-anim${resetAnim ? " marquee-reset" : ""}`}
          style={{
            whiteSpace: "nowrap",
            display: "inline-block",
            willChange: "transform",
            animation: resetAnim ? "none" : "marquee-scroll 14s linear 1"
          }}
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
