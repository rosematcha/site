import { MemoryRouter } from "react-router-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { clients, projects } from "../data/site";

import { ContributionLink } from "./ContributionLink";
import { ContributionProvider } from "./ContributionProvider";

afterEach(() => vi.unstubAllGlobals());
function note(title: string, fromResume = false) {
  const item = [...clients, ...projects].find(project => project.title === title);
  if (!item) {
    throw new Error(title);
  }
  render(
    <MemoryRouter>
      <ContributionProvider>
        <ContributionLink client={clients.includes(item)} fromResume={fromResume} item={item} />
      </ContributionProvider>
    </MemoryRouter>
  );
}
describe("contribution notes", () => {
  it("announces the contribution on keyboard focus on desktop", async () => {
    vi.stubGlobal("innerWidth", 1440);
    note("Ruby City");
    fireEvent.focus(screen.getByRole("link", { name: "Ruby City" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("visitor-services training tools");
    expect(screen.getByRole("link", { name: "Ruby City" })).toHaveAttribute(
      "aria-describedby",
      "contribution-note"
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
  it("opens a phone spotlight and returns focus to the real link", async () => {
    vi.stubGlobal("innerWidth", 390);
    note("Ruby City");
    const link = screen.getByRole("link", { name: "Ruby City" });
    await userEvent.click(link);
    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Visit organization" })).toHaveAttribute(
      "href",
      "https://rubycity.org/"
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(link).toHaveFocus();
  });
  it("labels personal projects and resume cross-links accurately", async () => {
    vi.stubGlobal("innerWidth", 390);
    note("FilmScraper");
    await userEvent.click(screen.getByRole("link", { name: "FilmScraper" }));
    expect(await screen.findByRole("link", { name: "View project" })).toHaveAttribute(
      "href",
      "https://filmscraper.rosematcha.com/"
    );
  });
  it("keeps modified clicks available for normal browser behavior", () => {
    vi.stubGlobal("innerWidth", 390);
    note("Ruby City");
    fireEvent.click(screen.getByRole("link", { name: "Ruby City" }), { ctrlKey: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
