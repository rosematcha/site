import { MemoryRouter } from "react-router-dom";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContributionProvider } from "../components/ContributionProvider";

import ResumePage from "./ResumePage";

function resume(path = "/resume") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ContributionProvider>
        <ResumePage />
      </ContributionProvider>
    </MemoryRouter>
  );
}
describe("experience-first resume", () => {
  it("opens all eleven roles and every supporting section by default", () => {
    resume();
    expect(screen.getAllByRole("article")).toHaveLength(11);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    ["Experience", "Client work", "Personal projects", "Skills", "Education"].forEach(name => {
      expect(screen.getByRole("heading", { name, level: 2 })).toBeVisible();
    });
    expect(screen.queryByRole("button", { expanded: false })).not.toBeInTheDocument();
    expect(
      screen.getByText("Developer · systems administrator · photographer · organizer · teacher")
    ).toBeVisible();
  });
  it("respects saved lens URLs while leaving skills and education visible", () => {
    resume("/resume?lens=sysadmin");
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Sysadmin" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("heading", { name: "Education" })).toBeVisible();
  });
  it("searches beyond the active lens and opens the actual matching bullets", async () => {
    const user = userEvent.setup();
    resume("/resume?lens=sysadmin");
    await user.type(screen.getByRole("searchbox"), "quickbooks");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("Hop + Vine")).toBeVisible();
    expect(screen.getAllByText("QuickBooks")[0]).toBeVisible();
    expect(screen.getByRole("button", { name: "Sysadmin" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
  it("filters only experience and clears search when a lens is selected", async () => {
    const user = userEvent.setup();
    resume();
    await user.type(screen.getByRole("searchbox"), "Google");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Arts + ed" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByRole("heading", { name: "Skills" })).toBeVisible();
  });
  it.each(["[", ".*", "kubernetes"])("handles a literal search for %s", async query => {
    const user = userEvent.setup();
    resume();
    await user.type(screen.getByRole("searchbox"), query === "[" ? "[[" : query);
    expect(screen.getByText("No roles match.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Education" })).toBeVisible();
  });
  it("keeps the skill match visible even without a matching role", async () => {
    const user = userEvent.setup();
    resume();
    await user.type(screen.getByRole("searchbox"), "React");
    const section = screen.getByRole("heading", { name: "Skills" }).parentElement;
    expect(section).not.toBeNull();
    if (section) {
      expect(within(section).getByText("React")).toBeVisible();
    }
  });
  it("links client and project names back to their actual Work entries", () => {
    resume();
    expect(screen.getByRole("link", { name: "SAY Sí" })).toHaveAttribute(
      "href",
      "/work#client-say-s"
    );
    expect(screen.getByRole("link", { name: "FilmScraper" })).toHaveAttribute(
      "href",
      "/work#project-filmscraper"
    );
  });
  it("prints without mutating the visible resume", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const user = userEvent.setup();
    resume();
    await user.click(screen.getByRole("button", { name: "Print / PDF" }));
    expect(print).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("article")).toHaveLength(11);
    print.mockRestore();
  });
});
