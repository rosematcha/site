// Optimized image component with intersection observer and progressive loading
import React, { useState, useRef, useEffect } from 'react';
import { createImageObserver } from '../utils/imageLoader';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto', // Note: React expects camelCase
  sizes,
  onLoad,
  onError,
  placeholder = null,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(loading === 'eager');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const imgElement = imgRef.current;
    
    // Set fetchpriority DOM attribute directly to avoid React warning
    if (imgElement && fetchPriority) {
      imgElement.setAttribute('fetchpriority', fetchPriority);
    }

    // Only set up intersection observer for lazy-loaded images
    if (loading === 'lazy' && imgElement) {
      observerRef.current = createImageObserver(imgElement, () => {
        setShouldLoad(true);
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, fetchPriority]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(e);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      {/* Placeholder while loading */}
      {!isLoaded && !hasError && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          {placeholder}
        </div>
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={shouldLoad ? src : undefined}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          <div className="text-center p-4">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Image unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;