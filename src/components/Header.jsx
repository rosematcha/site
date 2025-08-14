// src/components/Header.jsx
import React, { useCallback, useRef } from "react";
import { NavLink } from "react-router-dom"; // Using NavLink for potential active styling
import { warmProjectsThumbnails, warmGuestbook, prefetchProjectRoutes } from "../utils/prefetch";

function Header() {
  const warmed = useRef({ projects: false, guestbook: false });

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

  return (
    <header className="main-header panel">
      <div className="header-inner">
        <div className="brand-row">
          <h1 className="site-main-title">
            <NavLink to="/" className="site-title-link">
              <span>rosematcha</span>
              <span className="badge">portfolio</span>
            </NavLink>
          </h1>
          <div className="window-controls" aria-hidden="true">
            <span className="wc" />
            <span className="wc" />
            <span className="wc" />
          </div>
        </div>
        <nav className="main-nav" aria-label="Primary">
          <ul>
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? "active" : "")}
                end
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/projects"
                className={({ isActive }) => (isActive ? "active" : "")}
                onMouseEnter={onProjectsIntent}
                onPointerEnter={onProjectsIntent}
                onTouchStart={onProjectsIntent}
                onFocus={onProjectsIntent}
              >
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/resume"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Resume
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/guestbook"
                className={({ isActive }) => (isActive ? "active" : "")}
                onMouseEnter={onGuestbookIntent}
                onPointerEnter={onGuestbookIntent}
                onTouchStart={onGuestbookIntent}
                onFocus={onGuestbookIntent}
              >
                Guestbook
              </NavLink>
            </li>
            <li>
              <a href="mailto:hi@rosematcha.com">Contact</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
