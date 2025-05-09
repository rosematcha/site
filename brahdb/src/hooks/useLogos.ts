import { useState, useEffect } from 'react';
import { restaurantDisplay } from '../components/ReviewCard';

export function useLogos() {
  const [logosLoaded, setLogosLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const loadLogos = async () => {
      const logoResults = await Promise.allSettled(
        Object.values(restaurantDisplay).map(({ logo, display }) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(display);
            img.onerror = () => reject(new Error(`Failed to load ${display} logo`));
            img.src = `/logos/${logo}.svg`;
          });
        })
      );

      const failedLogos = logoResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason.message);

      if (failedLogos.length > 0) {
        console.warn('Some logos failed to load:', failedLogos);
        setErrors(failedLogos);
      }

      // Consider logos loaded even if some fail - the UI will handle missing logos gracefully
      setLogosLoaded(true);
    };

    loadLogos().catch(err => {
      console.error('Error in loadLogos:', err);
      setLogosLoaded(true); // Proceed anyway to prevent app from getting stuck
    });
  }, []);

  return { logosLoaded, errors };
}