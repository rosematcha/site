import { MemoryRouter } from "react-router-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("site routes", () => {
  it("uses the exact home heading and introduces the approved roles", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Howdy, I'm Reese!");
    expect(
      screen.getByText(/I'm a web developer, photographer, organizer, and youth educator/)
    ).toBeVisible();
    expect(screen.queryByText(/maintain too many personal projects/)).not.toBeInTheDocument();
  });
  it("focuses the new h1 after navigation", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByRole("link", { name: "Resume" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Reese Lundquist", level: 1 })).toHaveFocus();
    });
  });
  it("does not reset focus to h1 when an experience filter changes", async () => {
    render(
      <MemoryRouter initialEntries={["/resume"]}>
        <App />
      </MemoryRouter>
    );
    const button = screen.getByRole("button", { name: "Web" });
    await userEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveFocus();
    });
  });
  it("keeps old project bookmarks working", async () => {
    render(
      <MemoryRouter initialEntries={["/projects"]}>
        <App />
      </MemoryRouter>
    );
    expect(
      await screen.findByRole("heading", { name: "Personal projects", level: 1 })
    ).toBeVisible();
  });
  it("does not invent a gallery for an unknown event", () => {
    render(
      <MemoryRouter initialEntries={["/photos/missing"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
