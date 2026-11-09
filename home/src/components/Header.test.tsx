import { MemoryRouter } from "react-router-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Header from "./Header";

afterEach(() => vi.unstubAllGlobals());
function openMenu() {
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
}
describe("dedicated navigation", () => {
  it("exposes all five destinations and a working skip link", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    ["Home", "Work", "Resume", "Photos", "Guestbook"].forEach(name => {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#main-content"
    );
  });
  it("focuses the first menu item and returns focus after Escape", () => {
    openMenu();
    expect(screen.getByRole("link", { name: "Home" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  });
  it("only closes for the actual desktop breakpoint", () => {
    openMenu();
    vi.stubGlobal("innerWidth", 679);
    fireEvent(window, new Event("resize"));
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    vi.stubGlobal("innerWidth", 680);
    fireEvent(window, new Event("resize"));
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
  it("does not steal focus for Escape when the menu is closed", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: "Work" });
    link.focus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(link).toHaveFocus();
  });
});
