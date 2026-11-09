import { useContext, useRef, type MouseEvent } from "react";

import { Link } from "react-router-dom";

import type { Contribution } from "../data/site";

import { ContributionContext } from "./contributionContext";

function actionLabel(client: boolean, fromResume: boolean): string {
  if (client) {
    return fromResume ? "View client work" : "Visit organization";
  }
  return "View project";
}
export function ContributionLink({
  item,
  client = false,
  fromResume = false,
  onActivate,
}: {
  item: Contribution;
  client?: boolean;
  fromResume?: boolean;
  onActivate?: () => void;
}) {
  const api = useContext(ContributionContext);
  const pointer = useRef("mouse");
  const anchor = useRef<HTMLAnchorElement>(null);
  if (!api) {
    throw new Error("ContributionLink requires ContributionProvider");
  }
  const href = fromResume ? `/work#${client ? "client" : "project"}-${item.id}` : item.url;
  const action = actionLabel(client, fromResume);
  const request = (anchor: HTMLAnchorElement) => ({
    item,
    anchor,
    href,
    action,
    external: !fromResume,
  });
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    onActivate?.();
    if (window.innerWidth >= 680 && pointer.current !== "touch") {
      api?.dismiss();
      return;
    }
    event.preventDefault();
    api?.show(request(event.currentTarget), true);
  }
  const handlers = {
    ref: anchor,
    "aria-describedby":
      api.anchor !== null && api.anchor === anchor.current ? "contribution-note" : undefined,
    onClick,
    onPointerDown: (event: React.PointerEvent<HTMLAnchorElement>) => {
      pointer.current = event.pointerType;
    },
    onPointerEnter: (event: React.PointerEvent<HTMLAnchorElement>) => {
      if (event.pointerType === "mouse") {
        onActivate?.();
      }
      if (event.pointerType === "mouse" && window.innerWidth >= 680) {
        api.show(request(event.currentTarget), false);
      }
    },
    onPointerLeave: api.scheduleClose,
    onFocus: (event: React.FocusEvent<HTMLAnchorElement>) => {
      onActivate?.();
      if (window.innerWidth >= 680 && pointer.current !== "touch") {
        api.show(request(event.currentTarget), false);
      }
    },
    onBlur: api.scheduleClose,
  };
  return fromResume ? (
    <Link className="text-link contribution-link" to={href} {...handlers}>
      {item.title}
    </Link>
  ) : (
    <a
      className="text-link contribution-link"
      data-preview-id={client ? undefined : item.id}
      href={href}
      id={`${client ? "client" : "project"}-${item.id}`}
      rel="noopener noreferrer"
      target="_blank"
      {...handlers}
    >
      {item.title}
    </a>
  );
}
