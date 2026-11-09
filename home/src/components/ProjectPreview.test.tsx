import { createRef } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { projects } from "../data/site";
import { previewRatio } from "../hooks/projectImages";

import { ProjectPreview } from "./ProjectPreview";

function project(index: number) {
  const item = projects[index];
  if (!item) {
    throw new Error("Missing fixture");
  }
  return item;
}
describe("stationary preview transitions", () => {
  it("keeps an opaque backing layer while the new screenshot fades in", async () => {
    const frame = createRef<HTMLDivElement>();
    const first = project(0);
    const next = project(1);
    const { rerender } = render(<ProjectPreview frameRef={frame} project={first} />);
    rerender(<ProjectPreview frameRef={frame} project={next} />);
    await screen.findByAltText(`Screenshot of ${next.title}`);
    expect(frame.current?.querySelectorAll("img")).toHaveLength(2);
    expect(frame.current?.querySelector(".preview-backing")).toHaveAttribute("src", first.image);
    await waitFor(() => {
      expect(frame.current?.querySelectorAll("img")).toHaveLength(1);
    });
  });
  it("does not replace the preview with a broken image", async () => {
    const first = project(0);
    const frame = createRef<HTMLDivElement>();
    const { rerender } = render(<ProjectPreview frameRef={frame} project={first} />);
    const decode = vi
      .spyOn(HTMLImageElement.prototype, "decode")
      .mockRejectedValueOnce(new Error("offline"));
    rerender(
      <ProjectPreview frameRef={frame} project={{ ...project(2), image: "/missing.webp" }} />
    );
    await waitFor(() => {
      expect(decode).toHaveBeenCalled();
    });
    expect(screen.getByAltText(`Screenshot of ${first.title}`)).toBeVisible();
    decode.mockRestore();
  });
  it("uses the approved adaptive proportions", () => {
    expect(previewRatio(project(0))).toBe(1.25);
    expect(previewRatio(project(2))).toBe(1.5);
  });
});
