// src/components/Header.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { warmProjectsThumbnails, warmGuestbook, prefetchProjectRoutes } from "../utils/prefetch";

function Header() {
  const location = useLocation();
  const warmed = useRef({ projects: false, guestbook: false });
  const [isNavOpen, setIsNavOpen] = useState(false);

  const onProjectsIntent = useCallback(() => {
    if (warmed.current.projects) return;
    warmed.current.projects = true;
    warmProjectsThumbnails();
    prefetchProjectRoutes();
  }, []);

  const onGuestbookIntent = useCallback(() => {
    if (warmed.current.guestbook) return;
    warmed.current.guestbook = true;
    warmGuestbook();
  }, []);

  const closeNav = useCallback(() => {
    setIsNavOpen(false);
  }, []);

  const toggleNav = useCallback(() => {
    setIsNavOpen(prev => !prev);
  }, []);

  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => {
      if (window.innerWidth > 760) {
        setIsNavOpen(false);
      }
    };
    const handleKeyDown = event => {
      if (event.key === "Escape") {
        setIsNavOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className={`main-header panel ${isNavOpen ? "nav-open" : ""}`}>
      <div className="header-inner">
        <div className="brand-row">
          {/* The wordmark is site chrome, not a page heading. Each page
              supplies its own h1 so heading order stays valid. */}
          <div className="site-main-title">
            <NavLink to="/" className="site-title-link" onClick={closeNav}>
              <span className="brand-primary">rosematcha</span>
            </NavLink>
          </div>
        </div>
        <nav
          id="site-primary-nav"
          className={`main-nav ${isNavOpen ? "is-open" : ""}`}
          aria-label="Primary"
        >
          <ul>
            <li className="nav-item nav-item--projects">
              <NavLink
                to="/projects"
                className={({ isActive }) => (isActive ? "active" : "")}
                onMouseEnter={onProjectsIntent}
                onPointerEnter={onProjectsIntent}
                onPointerDown={onProjectsIntent}
                onMouseDown={onProjectsIntent}
                onTouchStart={onProjectsIntent}
                onFocus={onProjectsIntent}
                title="Projects"
                onClick={closeNav}
              >
                Projects
              </NavLink>
            </li>
            <li className="nav-item nav-item--resume">
              <NavLink
                to="/resume"
                className={({ isActive }) => (isActive ? "active" : "")}
                title="Resume"
                onClick={closeNav}
              >
                Resume
              </NavLink>
            </li>
            <li className="nav-item nav-item--guestbook">
              <NavLink
                to="/guestbook"
                className={({ isActive }) => (isActive ? "active" : "")}
                onMouseEnter={onGuestbookIntent}
                onPointerEnter={onGuestbookIntent}
                onTouchStart={onGuestbookIntent}
                onFocus={onGuestbookIntent}
                title="Guestbook"
                onClick={closeNav}
              >
                Guestbook
              </NavLink>
            </li>
            <li className="nav-item nav-item--contact">
              <a href="mailto:howdy@rosematcha.com" title="Contact" onClick={closeNav}>
                Contact
              </a>
            </li>
          </ul>
        </nav>
        <div className="header-controls">
          <button
            type="button"
            className={`nav-toggle ${isNavOpen ? "is-active" : ""}`}
            aria-expanded={isNavOpen}
            aria-controls="site-primary-nav"
            aria-label={isNavOpen ? "Close menu" : "Open menu"}
            data-state={isNavOpen ? "open" : "closed"}
            onClick={toggleNav}
          >
            <span className="nav-toggle__icon" aria-hidden="true">
              {isNavOpen ? <X size={20} /> : <Menu size={20} />}
            </span>
            <span className="nav-toggle__label">Menu</span>
          </button>
        </div>
        <div
          className={`nav-backdrop ${isNavOpen ? "is-visible" : ""}`}
          aria-hidden="true"
          onClick={closeNav}
        />
      </div>
    </header>
  );
}

export default Header;
