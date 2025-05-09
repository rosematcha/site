import React, { useEffect, useState, useRef } from 'react';

interface LoadingSpinnerProps {
  fadeOut?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fadeOut }) => {
  const [isVisible, setIsVisible] = useState(true);
  const spinnerRef = useRef<HTMLDivElement>(null);
  
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
      <img
        src="/loading.png"
        alt="Loading..."
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
    </div>
  );
};

export default LoadingSpinner;