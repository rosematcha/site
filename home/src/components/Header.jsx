// src/components/Header.jsx
import React, { useCallback, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Briefcase,
  FileText,
  MessageSquare,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { warmProjectsThumbnails, warmGuestbook, prefetchProjectRoutes } from "../utils/prefetch";

function Header() {
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
    setIsNavOpen((prev) => !prev);
  }, []);

  return (
    <header className={`main-header panel ${isNavOpen ? "nav-open" : ""}`}>
      <div className="header-inner">
        <div className="brand-row">
          <h1 className="site-main-title">
            <NavLink to="/" className="site-title-link">
              <span className="brand-primary">rosematcha</span>
              <span className="badge ">portfolio</span>
            </NavLink>
          </h1>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={isNavOpen}
            aria-controls="site-primary-nav"
            onClick={toggleNav}
          >
            <span className="sr-only">Toggle navigation</span>
            {isNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav
          id="site-primary-nav"
          className={`main-nav ${isNavOpen ? "is-open" : ""}`}
          aria-label="Primary"
        >
          <ul>
            <li className="nav-item nav-item--home">
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? "active" : "")}
                end
                title="Home"
                onClick={closeNav}
              >
                <Home size={18} />
                <span>Home</span>
              </NavLink>
            </li>
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
                <Briefcase size={18} />
                <span>Projects</span>
              </NavLink>
            </li>
            <li className="nav-item nav-item--resume">
              <NavLink
                to="/resume"
                className={({ isActive }) => (isActive ? "active" : "")}
                title="Resume"
                onClick={closeNav}
              >
                <FileText size={18} />
                <span>Resume</span>
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
                <MessageSquare size={18} />
                <span>Guestbook</span>
              </NavLink>
            </li>
            <li className="nav-item nav-item--contact">
              <a href="mailto:hi@rosematcha.com" title="Contact" onClick={closeNav}>
                <Mail size={18} />
                <span>Contact</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
