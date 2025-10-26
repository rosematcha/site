import { useState, useEffect } from 'react';
import { restaurantDisplay } from '../constants/restaurantDisplay';

export function useLogos() {
  const [logosLoaded, setLogosLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const loadLogos = () => {
      setLogosLoaded(true); // Set to true immediately to hide spinner
      const failed: string[] = [];
      Object.values(restaurantDisplay).forEach(({ logo, display }) => {
        const url = `/brahdb/logos/${logo}.svg`;
        const img = new Image();
        img.onload = () => {};
        img.onerror = () => {
          failed.push(`Failed to load ${display} logo`);
          setErrors(prev => [...prev, `Failed to load ${display} logo`]);
        };
        img.src = url;
      });
    };

    loadLogos();
  }, []);

  return { logosLoaded, errors };
}