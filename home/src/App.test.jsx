import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import App from "./App";

vi.mock("./utils/prefetch", () => ({
  warmProjectsThumbnails: vi.fn(),
  warmGuestbook: vi.fn(),
  prefetchProjectRoutes: vi.fn(),
}));

afterEach(() => vi.unstubAllGlobals());

function BackButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Go back</button>;
}

describe("route scrolling", () => {
  it("starts new pages at the top without overriding browser back restoration", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    render(
      <MemoryRouter initialEntries={["/resume"]}>
        <App />
        <BackButton />
      </MemoryRouter>
    );
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("link", { name: "Projects" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    scrollTo.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
