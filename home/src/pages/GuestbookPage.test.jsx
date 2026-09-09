import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GuestbookPage from "./GuestbookPage";

afterEach(() => vi.unstubAllGlobals());

describe("guestbook loading", () => {
  it("keeps one results region through loading and populated states", async () => {
    let resolve;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise(done => {
            resolve = done;
          })
      )
    );
    render(
      <MemoryRouter>
        <GuestbookPage />
      </MemoryRouter>
    );
    const region = screen.getByRole("region", { name: "Guestbook entries" });
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading the wall…")).toBeInTheDocument();
    resolve({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [
        { id: "1", name: "Visitor", message: "Test message", date: "September 9, 2026" },
      ],
    });
    expect(await screen.findByText("Test message")).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-busy", "false");
    expect(screen.getByRole("region", { name: "Guestbook entries" })).toBe(region);
  });

  it("settles an empty response without removing the reserved region", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [],
      })
    );
    render(
      <MemoryRouter>
        <GuestbookPage />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Guestbook entries" })).toHaveAttribute(
        "aria-busy",
        "false"
      )
    );
    expect(screen.getByText("No messages yet. Be the first on the wall.")).toBeInTheDocument();
  });
});
