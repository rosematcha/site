// src/components/Header.jsx
import React from "react";
import { NavLink } from "react-router-dom"; // Using NavLink for potential active styling
import "./Header.css";

function Header() {
  return (
    <header className="main-header">
      <h1 className="site-main-title">
        <NavLink to="/" className="site-title-link">
          ✨ rosematcha.com ✨
        </NavLink>
      </h1>
      <nav className="main-nav">
        <ul>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/projects"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Projects
            </NavLink>
          </li>
          {
          <li>
            <NavLink
              to="/resume"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Resume
            </NavLink>
          </li>
          }
          <li>
            <NavLink
              to="/guestbook"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Guestbook
            </NavLink>
          </li>
          <li>
            <a href="mailto:hi@rosematcha.com">Contact</a>
          </li>
        </ul>
      </nav>
      <hr className="header-divider" />
    </header>
  );
}

export default Header;
