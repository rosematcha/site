import { useEffect, useRef, useState } from "react";

import { Link, NavLink } from "react-router-dom";

import { destinations } from "../data/site";

export default function Header() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (open) {
      nav.current?.querySelector("a")?.focus();
    }
  }, [open]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || !open) {
        return;
      }
      setOpen(false);
      button.current?.focus();
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !header.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function resize() {
      if (window.innerWidth >= 680) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  return (
    <header ref={header} className="site-header">
      <a
        className="skip-link"
        href="#main-content"
        onClick={event => {
          event.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ block: "start" });
        }}
      >
        Skip to content
      </a>
      <div className="nav-inner">
        <Link
          aria-label="rosematcha home"
          className="wordmark"
          to="/"
          onClick={() => {
            setOpen(false);
          }}
        >
          rosematcha
        </Link>
        <button
          ref={button}
          aria-controls="primary-nav"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="patch menu-button"
          type="button"
          onClick={() => {
            setOpen(value => !value);
          }}
        >
          Menu
        </button>
        <nav
          ref={nav}
          aria-label="Primary"
          className={open ? "is-open" : ""}
          id="primary-nav"
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setOpen(false);
            }
          }}
        >
          <ul>
            {destinations.map(item => (
              <li key={item.to}>
                <NavLink
                  className="patch"
                  end={item.to === "/"}
                  to={item.to}
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
