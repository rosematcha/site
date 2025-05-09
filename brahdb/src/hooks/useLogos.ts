import { useState, useEffect } from 'react';
import { restaurantDisplay } from '../components/ReviewCard';

export function useLogos() {
  const [logosLoaded, setLogosLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const loadLogos = async () => {
      console.log('[useLogos] Starting logo preloading...');
      const logoResults = await Promise.allSettled(
        Object.values(restaurantDisplay).map(({ logo, display }) => {
          const url = `/logos/${logo}.svg`;
          console.log(`[useLogos] Attempting to load logo: ${display} (${url})`);
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(display);
            img.onerror = () => reject(new Error(`Failed to load ${display} logo`));
            img.src = url;
          });
        })
      );

      const failedLogos = logoResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason.message);

      const successCount = logoResults.length - failedLogos.length;

      if (failedLogos.length > 0) {
        console.warn('[useLogos] Some logos failed to load:', failedLogos);
        setErrors(failedLogos);
      }

      console.log(`[useLogos] Logo preloading complete. Success: ${successCount}, Failed: ${failedLogos.length}`);

      // Consider logos loaded even if some fail - the UI will handle missing logos gracefully
      setLogosLoaded(true);
    };

    loadLogos().catch(err => {
      console.error('[useLogos] Error in loadLogos:', err);
      setLogosLoaded(true); // Proceed anyway to prevent app from getting stuck
    });
  }, []);

  return { logosLoaded, errors };
}