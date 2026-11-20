// The kit's markup. Contract: .obj[data-h] > .face > .clip for anything that stands off the sheet; [data-ts] raised type; .btn
// pills; .shelf a full-width horizontal scroller whose snap stops are its [data-stop] descendants. The engine finds them by these
// classes and attributes, so the markup is the mock's to the element.
import type { CSSProperties, ReactNode } from "react";

import { Link } from "react-router-dom";

import type { Project } from "../data/portfolio";

const external = (u: string) => /^https?:/.test(u);
// a link: inside the site through the router, out of it in a new tab
export function To({
  to,
  className,
  id,
  children,
  label,
  style,
}: {
  to: string;
  className?: string;
  id?: string;
  children: ReactNode;
  label?: string;
  style?: CSSProperties;
}) {
  if (to.startsWith("/")) {
    return (
      <Link
        aria-label={label}
        className={className}
        draggable={false}
        id={id}
        style={style}
        to={to}
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      aria-label={label}
      className={className}
      draggable={false}
      href={to}
      id={id}
      rel={external(to) ? "noopener noreferrer" : undefined}
      style={style}
      target={external(to) ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}
export function Obj({
  h,
  children,
  className = "",
}: {
  h: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`obj${className ? ` ${className}` : ""}`} data-h={h}>
      <span className="face">{children}</span>
    </span>
  );
}
export interface Pic {
  src: string;
  alt: string;
  w: number;
  h: number;
  srcSet?: string;
  sizes?: string;
  pos?: string;
  load?: "eager" | "defer" | "lazy";
}
const PRIO = { eager: "high", defer: "low", lazy: undefined } as const;
// a deferred picture names its files in data- attributes until the engine asks for them (the portrait's later prints)
const sources = (p: Pic) =>
  p.load === "defer"
    ? { "data-src": p.src, "data-srcset": p.srcSet }
    : { src: p.src, srcSet: p.srcSet };
function Channel({ p, c }: { p: Pic; c: "r" | "g" | "b" }) {
  const first = c === "r";
  const load = p.load ?? "lazy";
  return (
    <span aria-hidden={first ? undefined : true} className={`ch ${c}`}>
      <img
        {...sources(p)}
        alt={first ? p.alt : ""}
        decoding="async"
        draggable={false}
        fetchPriority={PRIO[load]}
        height={p.h}
        loading={load === "lazy" ? "lazy" : undefined}
        sizes={p.srcSet ? p.sizes : undefined}
        style={p.pos ? { objectPosition: p.pos } : undefined}
        width={p.w}
      />
    </span>
  );
}
// chromatic aberration: three channel copies of a photograph (only the first carries alt), with its own grain
export function Ca({ p }: { p: Pic }) {
  return (
    <>
      <span className="ca">
        <Channel c="r" p={p} />
        <Channel c="g" p={p} />
        <Channel c="b" p={p} />
      </span>
      <span aria-hidden="true" className="pgrain" />
    </>
  );
}
export function Clip({ h, children }: { h: number; children: ReactNode }) {
  return (
    <Obj h={h}>
      <span className="clip">{children}</span>
    </Obj>
  );
}
// home's three screenshots that read from their top edge
const TOP = new Set(["events", "bexarvoting", "ciphermaniac"]);
type Heading = "h2" | "h3";
// a plate: picture, title, description. h is the picture's height off the sheet.
export function Plate({
  p,
  h = 12,
  tag: Tag = "h3",
  cls = "pj",
  id,
  to = p.url,
  img = p.image,
  size,
}: {
  p: Pick<Project, "id" | "title" | "description" | "url" | "image">;
  h?: number;
  tag?: Heading;
  cls?: string;
  id?: string;
  to?: string;
  img?: string;
  size: [number, number];
}) {
  return (
    <To className={`tile ${cls}`} id={id} to={to}>
      <Clip h={h}>
        <img
          alt=""
          decoding="async"
          draggable={false}
          height={size[1]}
          loading="lazy"
          src={img}
          style={TOP.has(p.id) ? { objectPosition: "50% 0" } : undefined}
          width={size[0]}
        />
      </Clip>
      <Tag className="t">{p.title}</Tag>
      <p>{p.description}</p>
    </To>
  );
}
// a client without a picture: its name set in the picture's 3:2 place (bottom-left) is the cell's heading
export function TypePlate({
  c,
  id,
}: {
  c: { title: string; description: string; url: string };
  id: string;
}) {
  return (
    <To className="tile cl tp" id={id} to={c.url}>
      <span className="tp-n">
        <h3 className="t" data-ts="4">
          {c.title}
        </h3>
      </span>
      <p>{c.description}</p>
    </To>
  );
}
// a shelf: one line of plates across the window; each <li> is a snap stop
export function Shelf<T>({
  items,
  render,
  cls,
  label,
  keyOf,
}: {
  items: T[];
  render: (x: T, i: number) => ReactNode;
  cls: string;
  label?: string;
  keyOf: (x: T) => string;
}) {
  return (
    <ul aria-labelledby={label} className={`shelf ${cls}`}>
      {items.map((x, i) => (
        <li key={keyOf(x)} data-stop="">
          {render(x, i)}
        </li>
      ))}
    </ul>
  );
}
export function Label({ children }: { children: ReactNode }) {
  return (
    <Obj h={5}>
      <span className="label">{children}</span>
    </Obj>
  );
}
export function Btn({ label, to, cls }: { label: string; to: string; cls?: string }) {
  return (
    <To className={`btn${cls ? ` ${cls}` : ""}`} to={to}>
      <Label>{label}</Label>
    </To>
  );
}
// a section heading band: the h2 and its pill
export function Head({ title, more, id }: { title: string; more: [string, string]; id: string }) {
  return (
    <div className="head col" id={`h-${id}`}>
      <h2 data-ts="4" id={`t-${id}`}>
        {title}
      </h2>
      <Btn cls="more" label={more[0]} to={more[1]} />
    </div>
  );
}
// the page head: the h1 on the column's left edge, a step under the home greeting
export function PHead({ title, id }: { title: string; id?: string }) {
  return (
    <div className="phead col">
      <h1 data-ts="5" id={id} tabIndex={-1}>
        {title}
      </h1>
    </div>
  );
}
