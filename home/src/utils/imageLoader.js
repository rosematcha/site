// Simple image loading utilities for lazy loading with IntersectionObserver

/**
 * Image intersection observer for lazy loading
 * @param {HTMLElement} img - Image element to observe
 * @param {Function} onVisible - Callback when image becomes visible
 * @returns {IntersectionObserver|null}
 */
export function createImageObserver(img, onVisible) {
  if (!("IntersectionObserver" in window) || !img || typeof onVisible !== "function") {
    return null;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          onVisible(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "200px 0px", // Load images before they enter viewport for smoother reveal
      threshold: 0,
    }
  );

  observer.observe(img);
  return observer;
}

// No-op functions for compatibility with existing code
export function loadProjectThumbnails() {
  // Browser handles preloading via native lazy loading
  return Promise.resolve();
}

export function loadRestaurantLogos() {
  // Browser handles preloading via native lazy loading
  return Promise.resolve(new Map());
}
