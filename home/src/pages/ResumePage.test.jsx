// Regression tests for the resume page. These cover the three things that
// were actually broken: search was scoped to the featured filter, the company
// link was nested inside the toggle button, and the toggle state was read off
// the button's aria-expanded by a CSS selector that no longer applies.
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import ResumePage from "./ResumePage";

const FEATURED_COUNT = 4;
const TOTAL_COUNT = 11;

function entryHeads() {
  return screen
    .getAllByRole("button", { expanded: false })
    .concat(screen.queryAllByRole("button", { expanded: true }));
}

describe("ResumePage", () => {
  beforeEach(() => {
    document.title = "";
  });

  it("opens on the featured subset", () => {
    render(<ResumePage />);
    expect(screen.getByText(/showing/)).toHaveTextContent(
      `showing ${FEATURED_COUNT} of ${TOTAL_COUNT}`
    );
  });

  it("sets a route-specific document title", () => {
    render(<ResumePage />);
    expect(document.title).toBe("Resume · rosematcha · Reese Lundquist");
  });

  it("searches the whole history even while the featured filter is on", async () => {
    const user = userEvent.setup();
    render(<ResumePage />);

    // Hop + Vine is not featured, and QuickBooks appears only in its bullets.
    await user.type(screen.getByLabelText("Search resume"), "quickbooks");

    expect(screen.getByText("Hop + Vine")).toBeInTheDocument();
    expect(screen.queryByText(/nothing matches that/i)).not.toBeInTheDocument();
  });

  it("reports a genuinely absent term as no match", async () => {
    const user = userEvent.setup();
    render(<ResumePage />);

    await user.type(screen.getByLabelText("Search resume"), "kubernetes");

    expect(screen.getByText(/nothing matches that/i)).toBeInTheDocument();
  });

  it("releases the featured chip's pressed state while a query is active", async () => {
    const user = userEvent.setup();
    render(<ResumePage />);
    const featured = screen.getByRole("button", { name: /^featured/ });

    expect(featured).toHaveAttribute("aria-pressed", "true");
    await user.type(screen.getByLabelText("Search resume"), "quickbooks");
    expect(featured).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the company link outside the toggle button", () => {
    render(<ResumePage />);
    const link = screen.getByRole("link", { name: "SAY Sí" });

    expect(link.closest("button")).toBeNull();
    expect(link).toHaveAttribute("href", "https://saysi.org/");
  });

  it("expands an entry and flags the open state on the card", async () => {
    const user = userEvent.setup();
    const { container } = render(<ResumePage />);
    const toggle = screen.getByRole("button", { name: "Systems Administrator, SAY Sí" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".resume-entry--open")).toBeNull();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector(".resume-entry--open")).not.toBeNull();
  });

  it("filters by a shared tag and clears back to featured", async () => {
    const user = userEvent.setup();
    render(<ResumePage />);

    await user.click(screen.getAllByRole("button", { name: "nonprofit" })[0]);
    expect(screen.getByText(/showing/)).toHaveTextContent(`showing 5 of ${TOTAL_COUNT}`);

    await user.click(screen.getByRole("button", { name: "clear" }));
    expect(screen.getByText(/showing/)).toHaveTextContent(
      `showing ${FEATURED_COUNT} of ${TOTAL_COUNT}`
    );
  });

  it("does not offer a filter for tags used by a single role", () => {
    render(<ResumePage />);
    // "automation" belongs to one entry only; filtering to it is pointless, so
    // it renders as static text rather than a control.
    expect(screen.queryByRole("button", { name: "automation" })).not.toBeInTheDocument();
    expect(screen.getByText("automation")).toBeInTheDocument();
  });

  it("shows every role under the all filter", async () => {
    const user = userEvent.setup();
    render(<ResumePage />);

    await user.click(screen.getByRole("button", { name: /^all/ }));

    expect(screen.getByText(/showing/)).toHaveTextContent(
      `showing ${TOTAL_COUNT} of ${TOTAL_COUNT}`
    );
  });

  it("writes ended roles in the past tense", async () => {
    const user = userEvent.setup();
    render(<ResumePage />);

    await user.click(screen.getByRole("button", { name: /^all/ }));
    await user.click(screen.getByRole("button", { name: "expand all" }));

    const entry = screen
      .getByRole("button", { name: "Media Arts Teaching Artist, SAY Sí" })
      .closest(".resume-entry");
    expect(within(entry).getByText(/^Taught and mentored/)).toBeInTheDocument();
  });

  it("uses an en dash, not an em dash, in date ranges", () => {
    const { container } = render(<ResumePage />);
    const dates = container.querySelector(".resume-entry__dates").textContent;

    expect(dates).toContain("–");
    expect(dates).not.toContain("—");
  });

  it("gives the search box a keyboard shortcut", async () => {
    const user = userEvent.setup();
    render(<ResumePage />);
    const search = screen.getByLabelText("Search resume");

    expect(search).not.toHaveFocus();
    await user.keyboard("/");
    expect(search).toHaveFocus();
  });
});

describe("ResumePage entry heads", () => {
  it("exposes one toggle per shown entry, named by role and company", () => {
    render(<ResumePage />);
    const heads = entryHeads().filter(b => b.classList.contains("resume-entry__toggler"));

    expect(heads).toHaveLength(FEATURED_COUNT);
    expect(heads.map(h => h.getAttribute("aria-label"))).toContain(
      "Visitor Services Associate, Ruby City"
    );
  });
});
