import { useState, useEffect, useMemo } from "react";
import "./TableOfContents.css";

/**
 * Extract headings from markdown content
 */
const extractHeadings = content => {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ level, text, id });
  }

  return headings;
};

/**
 * Smooth scroll animation with cubic easing
 */
const quickScrollTo = (targetY, duration = 250) => {
  const startY = window.scrollY;
  const diff = targetY - startY;
  if (diff === 0) return;
  
  const startTime = performance.now();

  // Cubic ease-in-out for smoother motion
  const easeInOutCubic = t => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = currentTime => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + diff * easeInOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

function TableOfContents({ content, title }) {
  const [activeId, setActiveId] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const headings = useMemo(() => extractHeadings(content), [content]);
  
  // Create full list with title as first "heading"
  const allItems = useMemo(() => {
    const titleItem = { level: 2, text: title, id: "top" };
    return [titleItem, ...headings];
  }, [title, headings]);

  useEffect(() => {
    if (allItems.length === 0) return undefined;

    const handleScroll = () => {
      // Check if at top of page
      if (window.scrollY < 100) {
        setActiveId("top");
        return;
      }
      
      const headingElements = headings
        .map(h => document.getElementById(h.id))
        .filter(Boolean);

      const scrollPos = window.scrollY + 120;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i];
        if (el.offsetTop <= scrollPos) {
          setActiveId(headings[i].id);
          return;
        }
      }
      setActiveId("top");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings, allItems]);

  if (headings.length < 2) {
    return null;
  }

  const handleClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (id === "top") {
      quickScrollTo(0, 250);
      setActiveId("top");
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.offsetTop - offset;
      quickScrollTo(top, 250);
      setActiveId(id);
    }
  };

  return (
    <nav className={`toc ${isExpanded ? "toc--expanded" : "toc--collapsed"}`} aria-label="Table of contents">
      <button
        className="toc__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse table of contents" : "Expand table of contents"}
      >
        <span className="toc__toggle-text">Contents</span>
        <svg
          className="toc__toggle-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isExpanded && (
        <ol className="toc__list">
          {allItems.map(heading => (
            <li
              key={heading.id}
              className={`toc__item toc__item--level-${heading.level}`}
            >
              <a
                href={heading.id === "top" ? "#" : `#${heading.id}`}
                className={`toc__link ${activeId === heading.id ? "toc__link--active" : ""}`}
                onClick={e => handleClick(e, heading.id)}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}

export default TableOfContents;
