// src/components/Footer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import quotes from "../assets/quotes";

const SPEED_PX_PER_S = 80; // px per second; tune via token if desired

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduced(e.matches);
    setReduced(mql.matches);
    if (typeof mql.addEventListener === "function") mql.addEventListener("change", onChange);
    else if (typeof mql.addListener === "function") mql.addListener(onChange);
    return () => {
      if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", onChange);
      else if (typeof mql.removeListener === "function") mql.removeListener(onChange);
    };
  }, []);
  return reduced;
}

function pickRandomQuote(prev) {
  if (!Array.isArray(quotes) || quotes.length === 0) return "";
  if (quotes.length === 1) return quotes[0];
  let q = prev;
  // avoid immediate repeat
  while (q === prev) {
    q = quotes[Math.floor(Math.random() * quotes.length)];
  }
  return q;
}

function Footer() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const initialQuote = useMemo(() => pickRandomQuote(undefined), []);
  const [quote, setQuote] = useState(initialQuote);
  const [cycle, setCycle] = useState(0);

  const reduced = usePrefersReducedMotion();

  // Dev override: allow ?motion=on or <html class="allow-motion"> to bypass reduced motion for testing
  const effectiveReduced = useMemo(() => {
    try {
      if (typeof document !== "undefined" && document.documentElement.classList.contains("allow-motion")) return false;
      if (typeof window !== "undefined") {
        const p = new URLSearchParams(window.location.search).get("motion");
        if (p === "on") return false;
      }
    } catch {
      // ignore URL/search parsing errors in exotic environments
    }
    return reduced;
  }, [reduced]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("motion");
    if (p === "on") document.documentElement.classList.add("allow-motion");
    if (p === "off") document.documentElement.classList.remove("allow-motion");
  }, []);

  useEffect(() => {
    if (effectiveReduced) return; // static display when reduced
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    // Clear any running animation, then start a new one after measuring
    track.style.animation = "none";

    let raf = 0;
    const start = () => {
      const containerWidth = container.clientWidth;
      const trackWidth = track.scrollWidth;
      const distance = containerWidth + trackWidth; // px to travel
      // add ~5% of the container width as off-screen breathing on each edge
      const pad = Math.round(containerWidth * 0.05);
      const durationMs = Math.max(8000, Math.round(( (distance + pad * 2) / SPEED_PX_PER_S) * 1000));
    // Start slightly offset to the right (+pad), end past the left by distance+pad
    track.style.setProperty("--marquee-x-start", `${pad}px`);
    track.style.setProperty("--marquee-x-end", `${-(distance + pad)}px`);
    // Force reflow
    void track.offsetHeight;
      track.style.animation = `marquee-run ${durationMs}ms linear 1`;
    };
    raf = window.requestAnimationFrame(start);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      track.style.animation = "none";
      track.style.removeProperty("--marquee-x-end");
      track.style.removeProperty("--marquee-x-start");
    };
  }, [cycle, effectiveReduced]);

  // Restart on resize to keep speed consistent for current viewport
  useEffect(() => {
    if (effectiveReduced) return;
    const onResize = () => setCycle((c) => c + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [effectiveReduced]);

  const handleEnd = () => {
    setQuote((prev) => pickRandomQuote(prev));
    setCycle((c) => c + 1);
  };

  return (
    <footer className="footer panel retro-marquee" role="contentinfo">
      <div ref={containerRef} className="marquee" aria-hidden="true">
        <div
          ref={trackRef}
          key={`marquee-cycle-${cycle}`}
          className="marquee__track"
          onAnimationEnd={handleEnd}
        >
          {quote}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
