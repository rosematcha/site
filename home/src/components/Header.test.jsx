import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";

vi.mock("../utils/prefetch", () => ({
  warmProjectsThumbnails: vi.fn(),
  warmGuestbook: vi.fn(),
  prefetchProjectRoutes: vi.fn(),
}));

afterEach(() => vi.unstubAllGlobals());

function openMenu() {
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
}

describe("mobile navigation", () => {
  it("stays open throughout the mobile breakpoint and closes on desktop", () => {
    openMenu();
    vi.stubGlobal("innerWidth", 740);
    fireEvent(window, new Event("resize"));
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    vi.stubGlobal("innerWidth", 761);
    fireEvent(window, new Event("resize"));
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("does not lock page scrolling for its inline menu", () => {
    openMenu();
    expect(document.body).not.toHaveClass("nav-menu-open");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
});
