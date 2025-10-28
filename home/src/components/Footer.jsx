// src/components/Footer.jsx
import React, { useMemo, useState, useRef } from "react";
import quotes from "../assets/quotes";

function Footer() {
  // Track which quotes have been shown in the current cycle
  const shownQuotes = useRef(new Set());
  const availableQuotes = useRef([...quotes]);
  
  const getNextQuote = () => {
    if (!Array.isArray(quotes) || quotes.length === 0) return "";
    if (quotes.length === 1) return quotes[0];
    
    // If all quotes have been shown, reset the cycle
    if (availableQuotes.current.length === 0) {
      shownQuotes.current.clear();
      availableQuotes.current = [...quotes];
    }
    
    // Pick a random quote from the available ones
    const randomIndex = Math.floor(Math.random() * availableQuotes.current.length);
    const selectedQuote = availableQuotes.current[randomIndex];
    
    // Remove the selected quote from available quotes
    availableQuotes.current.splice(randomIndex, 1);
    shownQuotes.current.add(selectedQuote);
    
    return selectedQuote;
  };
  
  const initialQuote = useMemo(() => getNextQuote(), []);
  const [quote, setQuote] = useState(initialQuote);

  const handleClick = () => {
    setQuote(getNextQuote());
  };

  return (
    <footer className="footer panel" role="contentinfo">
      <div 
        className="footer-quote"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        title="Click for a new quote"
      >
        {quote}
      </div>
      <div className="footer-copyright">
        © {new Date().getFullYear()} Reese Lundquist
      </div>
    </footer>
  );
}

export default Footer;
