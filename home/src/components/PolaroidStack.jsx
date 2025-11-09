import React from "react";
import PropTypes from "prop-types";
import "./PolaroidStack.css";

const defaultPhotos = [
  {
    src: "/img/polaroids/soykirb.webp",
    alt: "Reese surrounded by Kirby merch at a convention booth",
    label: "",
  },
  {
    src: "/img/polaroids/heatgun.webp",
    alt: "Reese demonstrating a heat gun technique during a workshop",
    label: "",
  },
  {
    src: "/img/polaroids/pultthorns.webp",
    alt: "Reese smiling in front of colorful plush art at a local market",
    label: "",
  },
];

function PolaroidStack({ photos = defaultPhotos, cycleInterval = 5000, showLabels = false }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const timerRef = React.useRef(null);

  const photoSet = React.useMemo(
    () => photos.filter((photo) => Boolean(photo?.src)),
    [photos],
  );

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = React.useCallback(() => {
    if (photoSet.length <= 1) {
      clearTimer();
      return;
    }

    clearTimer();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photoSet.length);
    }, cycleInterval);
  }, [clearTimer, cycleInterval, photoSet.length]);

  React.useEffect(() => {
    startTimer();

    return () => {
      clearTimer();
    };
  }, [startTimer, clearTimer]);

  const handleAdvance = React.useCallback(() => {
    if (photoSet.length === 0) {
      return;
    }

    setActiveIndex((prev) => (prev + 1) % photoSet.length);
  }, [photoSet.length]);

  const handleInteraction = React.useCallback(() => {
    handleAdvance();
    startTimer();
  }, [handleAdvance, startTimer]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleInteraction();
    }
  };

  const visibleLayers = 3;
  const rotationByLayer = [0, -4, 5];

  return (
    <div
      className="polaroid-stack"
      onClick={photoSet.length > 1 ? handleInteraction : undefined}
      onKeyDown={photoSet.length > 1 ? handleKeyDown : undefined}
      role={photoSet.length > 1 ? "button" : undefined}
      tabIndex={photoSet.length > 1 ? 0 : -1}
      aria-label="Browse featured polaroids"
      aria-live="polite"
    >
      {photoSet.map((photo, index) => {
        const relativeIndex =
          (index - activeIndex + photoSet.length) % photoSet.length;

        if (relativeIndex >= visibleLayers) {
          return null;
        }

        const isActive = relativeIndex === 0;
        const translateX = relativeIndex * 6;
        const translateY = relativeIndex * 12;
        const rotation = rotationByLayer[relativeIndex] ?? 0;
        const scale = 1 - relativeIndex * 0.04;
        const showCaption = showLabels && Boolean(photo.label);
        const captionText = showCaption ? photo.label : "\u00A0";

        return (
          <figure
            key={photo.src}
            className={`polaroid-card${isActive ? " is-active" : ""}`}
            style={{
              zIndex: visibleLayers - relativeIndex,
              transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`,
              opacity: Math.max(1 - relativeIndex * 0.25, 0.3),
            }}
          >
            <div className="polaroid-photo-wrapper">
              <img src={photo.src} alt={photo.alt} loading="lazy" />
            </div>
            <figcaption
              className={showCaption ? "" : "is-hidden"}
              aria-hidden={!showCaption}
            >
              {captionText}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

PolaroidStack.propTypes = {
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string,
      label: PropTypes.string,
    }),
  ),
  cycleInterval: PropTypes.number,
  showLabels: PropTypes.bool,
};

export default PolaroidStack;
