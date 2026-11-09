import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import { DialogShell } from "../components/DialogShell";
import { Section } from "../components/Section";
import { coverPhoto, events, type PhotoEvent } from "../data/site";
import { usePageMeta } from "../hooks/usePageMeta";

import NotFoundPage from "./NotFoundPage";

export default function PhotosPage() {
  usePageMeta("Photos");
  return (
    <Section>
      <h1 tabIndex={-1}>Photos</h1>
      <div className="event-grid">
        {events.map(event => {
          const cover = coverPhoto(event);
          return (
            <Link
              key={event.id}
              data-restore-focus
              className="event-link"
              id={`event-${event.id}`}
              to={`/photos/${event.id}`}
            >
              <div className="tile-image">
                <img
                  alt={cover.alt}
                  height={cover.height}
                  loading="lazy"
                  src={cover.thumbnail}
                  width={cover.width}
                />
              </div>
              <h2>{event.title}</h2>
              <p>{event.year}</p>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
function Gallery({ event }: { event: PhotoEvent }) {
  usePageMeta(`${event.title} ${event.year}`);
  const [index, setIndex] = useState<number | null>(null);
  const photo = index === null ? undefined : event.photos[index];
  useEffect(() => {
    const listener = (keyboard: KeyboardEvent) => {
      if (keyboard.key !== "ArrowLeft" && keyboard.key !== "ArrowRight") {
        return;
      }
      keyboard.preventDefault();
      const direction = keyboard.key === "ArrowRight" ? 1 : -1;
      setIndex(current =>
        current === null
          ? current
          : Math.max(0, Math.min(event.photos.length - 1, current + direction))
      );
    };
    if (index !== null) {
      window.addEventListener("keydown", listener);
    }
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [index, event.photos.length]);
  return (
    <Section className="gallery-band">
      <h1 tabIndex={-1}>{event.title}</h1>
      <p className="event-year">{event.year}</p>
      <Link className="patch gallery-back" to="/photos">
        Back to photos
      </Link>
      <div className="gallery">
        {event.photos.map((image, i) => (
          <button
            key={image.id}
            aria-label={`Enlarge photo ${String(i + 1)}: ${image.alt}`}
            className="gallery-photo"
            type="button"
            onClick={() => {
              setIndex(i);
            }}
          >
            <img
              alt={image.alt}
              decoding="async"
              height={image.height}
              loading={i < 2 ? "eager" : "lazy"}
              sizes="(min-width: 680px) 50vw, 100vw"
              src={image.src}
              srcSet={`${image.thumbnail} 480w, ${image.src} ${String(image.width)}w`}
              width={image.width}
            />
          </button>
        ))}
      </div>
      {photo && index !== null && (
        <DialogShell
          className="photo-viewer"
          label={`${event.title} ${event.year}, photo ${String(index + 1)}`}
          onDismiss={() => {
            setIndex(null);
          }}
        >
          <figure>
            <img alt={photo.alt} height={photo.height} src={photo.src} width={photo.width} />
            <figcaption>
              {event.title} {event.year} · {index + 1} of {event.photos.length}
            </figcaption>
          </figure>
          <div className="photo-controls">
            <button
              className="patch"
              disabled={index === 0}
              type="button"
              onClick={() => {
                setIndex(value => (value === null ? null : value - 1));
              }}
            >
              Previous
            </button>
            <button
              className="patch"
              disabled={index === event.photos.length - 1}
              type="button"
              onClick={() => {
                setIndex(value => (value === null ? null : value + 1));
              }}
            >
              Next
            </button>
          </div>
        </DialogShell>
      )}
    </Section>
  );
}
export function PhotoEventPage() {
  const { eventId } = useParams();
  const event = events.find(item => item.id === eventId);
  return event ? <Gallery key={event.id} event={event} /> : <NotFoundPage />;
}
