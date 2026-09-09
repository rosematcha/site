import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import PolaroidStack from "./PolaroidStack";

let motion;
beforeEach(() => {
  vi.useFakeTimers();
  motion = new EventTarget();
  motion.matches = false;
  vi.stubGlobal("matchMedia", () => motion);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function activePhoto(container) {
  return container.querySelector(".polaroid-card.is-active img").alt;
}

describe("polaroid motion", () => {
  it("cycles normally and stops when reduced motion is enabled", () => {
    const { container, unmount } = render(<PolaroidStack />);
    const first = activePhoto(container);
    act(() => vi.advanceTimersByTime(5000));
    expect(activePhoto(container)).not.toBe(first);
    motion.matches = true;
    act(() => motion.dispatchEvent(new Event("change")));
    const paused = activePhoto(container);
    act(() => vi.advanceTimersByTime(10000));
    expect(activePhoto(container)).toBe(paused);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("allows manual browsing with reduced motion without starting autoplay", () => {
    motion.matches = true;
    const { container } = render(<PolaroidStack />);
    const first = activePhoto(container);
    act(() => vi.advanceTimersByTime(10000));
    expect(activePhoto(container)).toBe(first);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(activePhoto(container)).not.toBe(first);
    expect(vi.getTimerCount()).toBe(0);
  });
});
