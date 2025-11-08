// Enhanced image loading utilities with parallel batching, caching, and progressive loading
// Optimizes network waterfalls and reduces blocking behavior

// Memory cache for loaded images to avoid redundant requests
const imageCache = new Map();
const loadingPromises = new Map();

// Check for data saver preference
const hasSaveData = () => {
  try {
    return (
      typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData
    );
  } catch {
    return false;
  }
};

/**
 * Enhanced image preloader with caching and error handling
 * @param {string} url - Image URL to load
 * @param {Object} options - Loading options
 * @returns {Promise<HTMLImageElement|null>}
 */
function preloadImage(url, options = {}) {
  if (!url) return Promise.resolve(null);

  // Return cached result if available
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url));
  }

  // Return existing promise if already loading
  if (loadingPromises.has(url)) {
    return loadingPromises.get(url);
  }

  const promise = new Promise(resolve => {
    const img = new Image();

    // Set loading attributes if supported
    if (options.loading) img.loading = options.loading;
    if (options.decoding) img.decoding = options.decoding;

    img.onload = () => {
      imageCache.set(url, img);
      loadingPromises.delete(url);
      resolve(img);
    };

    img.onerror = () => {
      imageCache.set(url, null); // Cache errors to avoid retries
      loadingPromises.delete(url);
      resolve(null);
    };

    img.src = url;
  });

  loadingPromises.set(url, promise);
  return promise;
}

/**
 * Add preload link hint to document head
 * @param {string} url - Image URL
 * @param {string} priority - Priority hint: "high", "low", "auto"
 * @param {string} type - Image type hint (optional)
 */
function addPreloadLink(url, priority = "auto", type = null) {
  try {
    if (typeof document === "undefined" || !url) return;

    // Avoid duplicating the same preload
    const existing = document.querySelector(`link[rel="preload"][as="image"][href="${url}"]`);
    if (existing) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    link.fetchpriority = priority;

    if (type) {
      link.type = type;
    }

    document.head.appendChild(link);
  } catch {
    // ignore
  }
}

/**
 * Parallel batch loader with configurable concurrency
 * @param {string[]} urls - Array of image URLs to load
 * @param {Object} options - Loading options
 * @returns {Promise<Array>}
 */
export async function loadImagesBatch(urls, options = {}) {
  if (!urls || urls.length === 0) return [];
  if (hasSaveData()) return []; // Respect data saver

  const {
    batchSize = 6, // Default batch size to avoid overwhelming browser
    priority = "auto",
    addHints = true,
    highPriorityCount = 2, // Number of images to load with high priority
  } = options;

  // Filter out invalid URLs and deduplicate
  const validUrls = [...new Set(urls.filter(Boolean))];

  // Add preload hints for better resource scheduling
  if (addHints) {
    validUrls.forEach((url, index) => {
      const imgPriority = index < highPriorityCount ? "high" : priority;
      addPreloadLink(url, imgPriority);
    });
  }

  const results = [];

  // Process URLs in batches to control concurrency
  for (let i = 0; i < validUrls.length; i += batchSize) {
    const batch = validUrls.slice(i, i + batchSize);
    const batchPromises = batch.map((url, batchIndex) => {
      const globalIndex = i + batchIndex;
      const loadingOptions = {
        loading: globalIndex < 4 ? "eager" : "lazy", // First few images eager
        decoding: "async",
      };
      return preloadImage(url, loadingOptions);
    });

    // Wait for current batch to complete before starting next
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Optimized loader for project thumbnails with intelligent prioritization
 * @param {Array} projects - Project data with thumbnail URLs
 * @returns {Promise<void>}
 */
export async function loadProjectThumbnails(projects) {
  if (!projects || projects.length === 0) return;

  const thumbnailUrls = projects.map(p => p.thumbnail).filter(Boolean);

  if (thumbnailUrls.length === 0) return;

  await loadImagesBatch(thumbnailUrls, {
    batchSize: 4, // Smaller batch for thumbnails
    priority: "low", // Non-critical for UX
    highPriorityCount: 2, // First two likely above fold
    addHints: true,
  });
}

/**
 * Optimized loader for restaurant logos with progressive loading
 * @param {Object} restaurantDisplay - Restaurant display data
 * @returns {Promise<Map>} - Map of logo URLs to load status
 */
export async function loadRestaurantLogos(restaurantDisplay) {
  if (!restaurantDisplay) return new Map();

  // Extract logo URLs from restaurant data
  const logoUrls = Object.values(restaurantDisplay)
    .map(({ logo }) => `/brahdb/logos/${logo}.svg`)
    .filter(Boolean);

  const results = await loadImagesBatch(logoUrls, {
    batchSize: 8, // Larger batches for SVGs (smaller files)
    priority: "low", // Logos are decorative, not critical
    highPriorityCount: 4, // Load first few with higher priority
    addHints: true,
  });

  // Create status map for easy lookup
  const statusMap = new Map();
  logoUrls.forEach((url, index) => {
    statusMap.set(url, results[index] ? "loaded" : "error");
  });

  return statusMap;
}

/**
 * Intelligent image intersection observer for lazy loading optimization
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
      rootMargin: "50px 0px", // Load images 50px before they enter viewport
      threshold: 0,
    }
  );

  observer.observe(img);
  return observer;
}

/**
 * Clear image cache (useful for memory management)
 */
export function clearImageCache() {
  imageCache.clear();
  loadingPromises.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  return {
    cached: imageCache.size,
    loading: loadingPromises.size,
    hasSaveData: hasSaveData(),
  };
}
