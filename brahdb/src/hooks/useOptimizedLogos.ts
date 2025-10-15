import { useState, useEffect } from 'react';
import { restaurantDisplay } from '../constants/restaurantDisplay';

// Enhanced logo loading with parallel batching and intelligent caching
interface LogoLoadStatus {
  loaded: boolean;
  errors: string[];
  loadingCount: number;
  totalCount: number;
}

// Memory cache for logo load status across component instances
const logoStatusCache = new Map<string, 'loaded' | 'error' | 'loading'>();

/**
 * Load images in parallel batches with configurable concurrency
 * @param urls Array of image URLs to load
 * @param batchSize Number of concurrent requests per batch
 * @returns Promise that resolves when all images are processed
 */
async function loadImagesBatch(urls: string[], batchSize: number = 8): Promise<Map<string, 'loaded' | 'error'>> {
  const results = new Map<string, 'loaded' | 'error'>();
  
  // Process URLs in batches to control concurrency
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchPromises = batch.map(async (url) => {
      // Return cached result if available
      if (logoStatusCache.has(url) && logoStatusCache.get(url) !== 'loading') {
        return { url, status: logoStatusCache.get(url)! };
      }
      
      // Mark as loading
      logoStatusCache.set(url, 'loading');
      
      return new Promise<{ url: string; status: 'loaded' | 'error' }>((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          logoStatusCache.set(url, 'loaded');
          resolve({ url, status: 'loaded' });
        };
        
        img.onerror = () => {
          logoStatusCache.set(url, 'error');
          resolve({ url, status: 'error' });
        };
        
        // Set loading attributes for better performance
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = url;
      });
    });
    
    // Wait for current batch to complete
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ url, status }) => {
      results.set(url, status);
    });
  }
  
  return results;
}

/**
 * Add preload hints for high-priority logos
 * @param urls Array of URLs to add preload hints for
 * @param count Number of high-priority logos to hint
 */
function addLogoPreloadHints(urls: string[], count: number = 4): void {
  try {
    if (typeof document === 'undefined') return;
    
    urls.slice(0, count).forEach((url) => {
      // Avoid duplicating existing preload hints
      const existing = document.querySelector(
        `link[rel="preload"][as="image"][href="${url}"]`
      );
      if (existing) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.fetchpriority = 'low'; // Logos are decorative, not critical
      document.head.appendChild(link);
    });
  } catch {
    // ignore
  }
}

export function useOptimizedLogos(): LogoLoadStatus {
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loadingCount, setLoadingCount] = useState(0);
  
  const restaurantEntries = Object.values(restaurantDisplay);
  const totalCount = restaurantEntries.length;

  useEffect(() => {
    const loadLogos = async () => {
      try {
        // Generate logo URLs
        const logoUrls = restaurantEntries.map(({ logo }) => `/brahdb/logos/${logo}.svg`);
        
        // Add preload hints for first few logos for better perceived performance
        addLogoPreloadHints(logoUrls, 6);
        
        // Track loading progress
        setLoadingCount(0);
        const failed: string[] = [];
        
        // Load logos in parallel batches
        const results = await loadImagesBatch(logoUrls, 8);
        
        // Process results
        let loadedCount = 0;
        results.forEach((status, url) => {
          if (status === 'loaded') {
            loadedCount++;
          } else {
            const restaurant = restaurantEntries.find(
              ({ logo }) => url === `/brahdb/logos/${logo}.svg`
            );
            if (restaurant) {
              failed.push(`Failed to load ${restaurant.display} logo`);
            }
          }
        });
        
        setLoadingCount(loadedCount);
        setErrors(failed);
        setLoaded(true); // Mark as complete regardless of individual failures
        
      } catch (error) {
        console.warn('Logo loading error:', error);
        setLoaded(true); // Still mark as complete to avoid infinite loading
        setErrors(['Failed to load restaurant logos']);
      }
    };

    loadLogos();
  }, []); // Empty dependency array since restaurant data is static

  return {
    loaded,
    errors,
    loadingCount,
    totalCount
  };
}

/**
 * Get cached logo status for a specific logo URL
 * @param logoUrl The logo URL to check
 * @returns The cached status or undefined if not cached
 */
export function getLogoStatus(logoUrl: string): 'loaded' | 'error' | 'loading' | undefined {
  return logoStatusCache.get(logoUrl);
}

/**
 * Clear the logo status cache (useful for testing or memory management)
 */
export function clearLogoCache(): void {
  logoStatusCache.clear();
}