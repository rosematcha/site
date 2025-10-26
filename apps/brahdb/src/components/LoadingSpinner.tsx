import React, { useEffect, useState, useRef } from 'react';

interface LoadingSpinnerProps {
  fadeOut?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fadeOut }) => {
  const [isVisible, setIsVisible] = useState(true);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const assetBase = import.meta.env.BASE_URL ?? '/';
  const spinnerPng = `${assetBase}loading.png`;
  const spinnerWebp = `${assetBase}loading.webp`;
  
  useEffect(() => {
    if (fadeOut) {
      setIsVisible(false);
    }
  }, [fadeOut]);

  return (
    <div
      ref={spinnerRef}
      className={`loading-spinner${!isVisible ? ' fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#18181b',
        zIndex: 50,
        opacity: 1,
        transition: 'opacity 0.7s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onTransitionEnd={() => {
        if (!isVisible && spinnerRef.current?.parentNode) {
          spinnerRef.current.remove();
        }
      }}
    >
      <picture style={{ width: 91, height: 120, display: 'block' }}>
        <source srcSet={spinnerWebp} type="image/webp" />
        <source srcSet={spinnerPng} type="image/png" />
        <img
          src={spinnerPng}
          alt="Loading animation"
          width={91}
          height={120}
          className="spinner-image"
          loading="eager"
          fetchPriority="high"
          style={{
            width: 91,
            height: 120,
            display: 'block',
          }}
        />
      </picture>
    </div>
  );
};

export default LoadingSpinner;