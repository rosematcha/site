// Optimized image component with intersection observer and progressive loading
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createImageObserver } from "../utils/imageLoader";
import "./OptimizedImage.css";

const OptimizedImage = ({
  src,
  alt,
  className = "",
  loading = "lazy",
  decoding = "async",
  fetchPriority = "auto", // Note: React expects camelCase
  sizes,
  width,
  height,
  aspectRatio,
  style,
  onLoad,
  onError,
  placeholder = null,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(loading === "eager");
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const hasPlaceholder = Boolean(placeholder);

  const computedAspectRatio = aspectRatio ?? (width && height ? width / height : undefined);
  const wrapperStyle = style ? { ...style } : {};
  if (computedAspectRatio && wrapperStyle.aspectRatio === undefined) {
    wrapperStyle.aspectRatio = computedAspectRatio;
  }

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  useEffect(() => {
    const imgElement = imgRef.current;

    // Set fetchpriority DOM attribute directly to avoid React warning
    if (imgElement && fetchPriority) {
      imgElement.setAttribute("fetchpriority", fetchPriority);
    }

    // Only set up intersection observer for lazy-loaded images
    if (loading === "lazy" && imgElement) {
      const observer = createImageObserver(imgElement, () => {
        setShouldLoad(true);
      });
      observerRef.current = observer;
      if (!observer) {
        setShouldLoad(true);
      }
    } else {
      setShouldLoad(true);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, fetchPriority]);

  const markLoaded = useCallback(
    event => {
      setIsLoaded(true);
      setHasError(false);
      if (event) {
        onLoad?.(event);
      }
    },
    [onLoad]
  );

  const handleLoad = e => {
    markLoaded(e);
    const img = e.currentTarget;
    if (img && typeof img.decode === "function") {
      img.decode().catch(() => {});
    }
  };

  const handleError = e => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(e);
  };

  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement || !shouldLoad || isLoaded || hasError) {
      return;
    }

    if (imgElement.complete && imgElement.naturalWidth > 0) {
      markLoaded(undefined);
    }
  }, [shouldLoad, src, isLoaded, hasError, markLoaded]);

  return (
    <div className={`optimized-image ${className}`} style={wrapperStyle} {...props}>
      {/* Placeholder while loading */}
      {hasPlaceholder && (
        <div className={`optimized-image__placeholder${isLoaded || hasError ? " is-hidden" : ""}`}>
          {placeholder}
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={shouldLoad ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        className={`optimized-image__img${isLoaded ? " is-loaded" : ""}`}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Error fallback */}
      {hasError && (
        <div className="optimized-image__error">
          <div className="optimized-image__error-content">
            <svg
              className="optimized-image__error-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="optimized-image__error-text">Image unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
