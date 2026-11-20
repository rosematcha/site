// Every page's frame: the skip link, the nav (the wordmark row from 600 px; the bars button and its menu), the ground's layers,
// the page's own <main>, and the closing. The engine attaches once this is in the document and detaches when the route leaves.
import { useLayoutEffect, type CSSProperties, type ReactNode } from "react";

import { Link, useLocation } from "react-router-dom";

import { destinations } from "../data/nav";
import { usePageMeta } from "../hooks/usePageMeta";

import { Btn } from "./markup";
import { pageShown } from "./shown";

type Current = "Home" | "Work" | "Photos" | "Resume" | "Guestbook" | "";
// on home the Home row and the wordmark stay the in-page jump to the top
const hrefOf = (to: string, current: Current) => (to === "/" && current === "Home" ? "#top" : to);
// the Photos row is "true" on a set (a page inside Photos), "page" on Photos itself
const mark = (label: string, current: Current, set: boolean) => {
  if (label !== current) {
    return undefined;
  }
  return set ? "true" : "page";
};
function Bars({ current, set }: { current: Current; set: boolean }) {
  return (
    <nav aria-label="Primary" className="bars" data-light="off">
      <button aria-controls="menu" aria-expanded="false" className="bars-btn" type="button">
        <span className="obj" data-h="6">
          <span className="face">
            <span className="sr">Menu, </span>
            <span className="where">{current || "Menu"}</span>
            <span aria-hidden="true" className="ico">
              <i />
              <i />
              <i />
            </span>
          </span>
        </span>
      </button>
      <div hidden className="menu" id="menu">
        <div className="menu-in">
          <ul>
            {destinations.map(({ to, label }, i) => (
              <li key={to} style={{ "--i": i } as CSSProperties}>
                <NavLink current={current} label={label} set={set} to={to}>
                  <span className="mw">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
function NavLink({
  to,
  label,
  current,
  set,
  children,
  className,
  aria,
}: {
  to: string;
  label: string;
  current: Current;
  set: boolean;
  children: ReactNode;
  className?: string;
  aria?: string;
}) {
  const href = hrefOf(to, current);
  const common = {
    "aria-current": mark(label, current, set),
    "aria-label": aria,
    className,
  } as const;
  if (href.startsWith("#")) {
    return (
      <a {...common} href={href}>
        {children}
      </a>
    );
  }
  return (
    <Link {...common} to={href}>
      {children}
    </Link>
  );
}
function TopRow({ current, set }: { current: Current; set: boolean }) {
  return (
    <header className="top col page">
      <NavLink
        aria="rosematcha home"
        className="wordmark"
        current={current}
        label=""
        set={set}
        to="/"
      >
        rosematcha
      </NavLink>
      <nav aria-label="Site" className="row-nav">
        <ul>
          {destinations.map(({ to, label }) => (
            <li key={to}>
              <NavLink current={current} label={label} set={set} to={to}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
function Closing({ inner }: { inner: boolean }) {
  return (
    <footer className={`closing${inner ? " inner" : ""} page`} id="hello">
      <div className="col">
        <h2 data-ts="4">Got something cooking?</h2>
        <p>I&apos;m always down to get involved with cool stuff. Let me lend you my skills!</p>
        <p className="mail">
          <Btn label="howdy@rosematcha.com" to="mailto:howdy@rosematcha.com" />
        </p>
      </div>
    </footer>
  );
}
export function Page({
  id,
  title,
  current,
  set = false,
  home = false,
  children,
}: {
  id: string;
  title: string | null;
  current: Current;
  set?: boolean;
  home?: boolean;
  children: ReactNode;
}) {
  usePageMeta(title);
  // this page is in the document now (route focus waits for it)
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    pageShown(pathname);
    return () => {
      pageShown(null);
    };
  }, [pathname]);
  return (
    <div className={`site ${id}`} data-track={home ? "" : undefined}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Bars current={current} set={set} />
      <div aria-hidden="true" className="keybox">
        <div className="key" />
      </div>
      <div aria-hidden="true" className="fx">
        <div className="grain" />
      </div>
      <TopRow current={current} set={set} />
      {children}
      <Closing inner={!home} />
    </div>
  );
}
