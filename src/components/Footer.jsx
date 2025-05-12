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
  const marqueeRef = useRef(null);

  function renderQuote(text) {
    return <><span role="img" aria-label="sparkle">✨</span> {text} <span role="img" aria-label="sparkle">✨</span></>;
  }

  useEffect(() => {
    const element = marqueeRef.current;
    if (!element) return;

    const handleBounce = () => {
      console.log('Marquee bounce detected');
      const newIdx = getRandomQuote(lastIndexRef.current);
      lastIndexRef.current = newIdx;
      setQuoteIndex(newIdx);
    };

    // Add the event listener to the DOM element
    element.addEventListener('bounce', handleBounce);

    // Cleanup
    return () => {
      element.removeEventListener('bounce', handleBounce);
    };
  }, []);

  return (
    <>
      <div className="custom-marquee-container">        <marquee
          ref={marqueeRef}
          behavior="scroll"
          direction="left"
          className="custom-marquee-text"
          scrollamount="6"
          loop="1"
        >
          {renderQuote(quotes[quoteIndex])}
        </marquee>
      </div>
      <div style={{ textAlign: "center", color: "#ffb3da", fontSize: "0.95em", margin: "10px 20px 20px 20px" }}>
        &copy; {currentYear}
      </div>
    </>
  );
}

export default Footer;
