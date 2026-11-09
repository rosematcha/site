import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { safeWebsite } from "../hooks/guestbook";
import fixtures from "../test/fixtures/guestbook.json";

import GuestbookPage from "./GuestbookPage";

const entry = {
  id: "1",
  name: "Visitor",
  message: "A real entry.",
  website: "https://example.org/",
  date: "November 9, 2026",
};
afterEach(() => vi.unstubAllGlobals());
describe("guestbook integration", () => {
  it("loads real API entries into the same reserved results region", async () => {
    let resolve: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>(done => {
            resolve = done;
          })
      )
    );
    render(<GuestbookPage />);
    const region = screen.getByRole("region", { name: "Guestbook entries" });
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status", { name: "Loading entries" })).toBeVisible();
    resolve?.(Response.json([entry]));
    expect(await screen.findByText(entry.message)).toBeVisible();
    expect(region).toHaveAttribute("aria-busy", "false");
    expect(screen.getByRole("region", { name: "Guestbook entries" })).toBe(region);
  });
  it("handles an empty response without sample signatures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));
    render(<GuestbookPage />);
    expect(await screen.findByText("No entries yet.")).toBeVisible();
  });
  it("reports an invalid response and retries successfully", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("<html>Not found</html>", { status: 404 }))
      .mockResolvedValueOnce(Response.json([entry]));
    vi.stubGlobal("fetch", fetch);
    render(<GuestbookPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByText(entry.message)).toBeVisible();
  });
  it("submits the Netlify field contract and keeps the successful entry", async () => {
    vi.stubEnv("DEV", false);
    const user = userEvent.setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    render(<GuestbookPage />);
    await screen.findByText("No entries yet.");
    await user.type(screen.getByLabelText("Your name"), "Reese");
    await user.type(screen.getByLabelText("Message"), "Hello from the test.");
    await user.click(screen.getByRole("button", { name: "Sign the guestbook" }));
    expect(await screen.findByText("Thanks for signing!")).toBeVisible();
    expect(screen.getByText("Hello from the test.")).toBeVisible();
    const payload: unknown = fetch.mock.calls[1]?.[1];
    if (!payload || typeof payload !== "object" || !("body" in payload) || !("method" in payload)) {
      throw new Error("Missing form request");
    }
    expect(payload.method).toBe("POST");
    expect(payload.body).toContain("form-name=guestbook");
    expect(payload.body).toContain("bot-field=");
    expect(screen.getByLabelText("Your name")).toHaveValue("");
  });
  it("keeps text available after a rejected submission", async () => {
    vi.stubEnv("DEV", false);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json([]))
        .mockResolvedValueOnce(new Response(null, { status: 500 }))
    );
    render(<GuestbookPage />);
    await screen.findByText("No entries yet.");
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Reese" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Keep this." } });
    const form = screen.getByRole("button", { name: "Sign the guestbook" }).closest("form");
    if (!form) {
      throw new Error("Missing guestbook form");
    }
    fireEvent.submit(form);
    expect(await screen.findByText("Couldn't save your entry. Try again.")).toBeVisible();
    expect(screen.getByLabelText("Message")).toHaveValue("Keep this.");
  });
  it("keeps a saved entry visible when reading the older entries failed", async () => {
    vi.stubEnv("DEV", false);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }))
    );
    render(<GuestbookPage />);
    await screen.findByRole("button", { name: "Retry" });
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Reese" } });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Saved despite the loading failure." },
    });
    const form = screen.getByRole("button", { name: "Sign the guestbook" }).closest("form");
    if (!form) {
      throw new Error("Missing form");
    }
    fireEvent.submit(form);
    expect(await screen.findByText("Thanks for signing!")).toBeVisible();
    expect(screen.getByText("Saved despite the loading failure.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();
  });
  it("does not post to the public site from the development preview", async () => {
    vi.stubEnv("DEV", true);
    const fetch = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetch);
    render(<GuestbookPage />);
    await screen.findByText("No entries yet.");
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Reese" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Preview." } });
    const form = screen.getByRole("button", { name: "Sign the guestbook" }).closest("form");
    if (!form) {
      throw new Error("Missing guestbook form");
    }
    fireEvent.submit(form);
    expect(await screen.findByText("Signing is available on the live site.")).toBeVisible();
    expect(fetch).toHaveBeenCalledOnce();
  });
  it.each(fixtures.unsafeWebsites)("does not expose unsafe website links: %s", input => {
    expect(safeWebsite(input)).toBe("");
  });
  it("renders guest text literally and drops an unsafe author link", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([fixtures.unsafeEntry])));
    render(<GuestbookPage />);
    expect(await screen.findByText("<script>alert(1)</script>")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Visitor" })).not.toBeInTheDocument();
  });
});
