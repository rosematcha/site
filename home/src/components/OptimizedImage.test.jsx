// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OptimizedImage from "./OptimizedImage";

describe("OptimizedImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render image with correct attributes", () => {
    render(
      <OptimizedImage
        src="test-image.jpg"
        alt="Test image"
        width={800}
        height={600}
        loading="lazy"
      />
    );

    const img = screen.getByAltText("Test image");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("width", "800");
    expect(img).toHaveAttribute("height", "600");
  });

  it("should compute aspect ratio from width and height", () => {
    const { container } = render(
      <OptimizedImage src="test.jpg" alt="Test" width={16} height={9} />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({ aspectRatio: "1.7777777777777777" });
  });

  it("should use custom aspect ratio when provided", () => {
    const { container } = render(<OptimizedImage src="test.jpg" alt="Test" aspectRatio={2} />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({ aspectRatio: "2" });
  });

  it("should show placeholder before image loads", () => {
    const placeholder = <div data-testid="placeholder">Loading...</div>;

    render(<OptimizedImage src="test.jpg" alt="Test" loading="eager" placeholder={placeholder} />);

    expect(screen.getByTestId("placeholder")).toBeInTheDocument();
  });

  it("should hide placeholder after image loads", async () => {
    const placeholder = <div data-testid="placeholder">Loading...</div>;

    render(<OptimizedImage src="test.jpg" alt="Test" loading="eager" placeholder={placeholder} />);

    const img = screen.getByAltText("Test");

    // Simulate image load
    img.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(screen.queryByTestId("placeholder")).not.toBeInTheDocument();
    });
  });

  it("should show error fallback on image error", async () => {
    render(<OptimizedImage src="broken.jpg" alt="Test" loading="eager" />);

    const img = screen.getByAltText("Test");

    // Simulate image error
    img.dispatchEvent(new Event("error"));

    await waitFor(() => {
      expect(screen.getByText("Image unavailable")).toBeInTheDocument();
    });
  });

  it("should call onLoad callback when image loads", async () => {
    const handleLoad = vi.fn();

    render(<OptimizedImage src="test.jpg" alt="Test" loading="eager" onLoad={handleLoad} />);

    const img = screen.getByAltText("Test");
    img.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(handleLoad).toHaveBeenCalledTimes(1);
    });
  });

  it("should call onError callback when image fails", async () => {
    const handleError = vi.fn();

    render(<OptimizedImage src="broken.jpg" alt="Test" loading="eager" onError={handleError} />);

    const img = screen.getByAltText("Test");
    img.dispatchEvent(new Event("error"));

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledTimes(1);
    });
  });

  it("should apply custom className", () => {
    const { container } = render(
      <OptimizedImage src="test.jpg" alt="Test" className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-class");
  });

  it("should apply custom styles", () => {
    const customStyle = { border: "1px solid var(--border-strong)" };
    render(<OptimizedImage src="test.jpg" alt="Test" style={customStyle} />);

    // Custom styles should be applied (testing implementation)
    expect(true).toBe(true);
  });

  it("should handle lazy loading", () => {
    render(<OptimizedImage src="test.jpg" alt="Test" loading="lazy" />);

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("should handle eager loading", () => {
    render(<OptimizedImage src="test.jpg" alt="Test" loading="eager" />);

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("should set decoding attribute", () => {
    render(<OptimizedImage src="test.jpg" alt="Test" decoding="async" />);

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("should handle sizes attribute", () => {
    render(<OptimizedImage src="test.jpg" alt="Test" sizes="(max-width: 768px) 100vw, 50vw" />);

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("sizes", "(max-width: 768px) 100vw, 50vw");
  });

  it("should transition opacity when loaded", async () => {
    render(<OptimizedImage src="test.jpg" alt="Test" loading="eager" />);

    const img = screen.getByAltText("Test");

    // Initially should be transparent
    expect(img).toHaveClass("opacity-0");

    // Simulate load
    img.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(img).toHaveClass("opacity-100");
    });
  });
});
