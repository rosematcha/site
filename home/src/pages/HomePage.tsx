import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { Section } from "../components/Section";
import { clients, coverPhoto, events, homeProjects, introduction } from "../data/site";
import { usePageMeta } from "../hooks/usePageMeta";

const portraits = [
  { src: "/img/portraits/me-camera.webp", alt: "Reese taking a photo", position: "50% 50%" },
  {
    src: "/img/portraits/me-soykirb.webp",
    alt: "Reese with Kirby plush toys",
    position: "50% 12%",
  },
  {
    src: "/img/portraits/me-pultthorns.webp",
    alt: "Reese at a Pikachu mural",
    position: "50% 12%",
  },
];
export default function HomePage() {
  const [portrait, setPortrait] = useState(0);
  const image = portraits[portrait] ?? portraits[0];
  usePageMeta(null);
  useEffect(() => {
    portraits.forEach(photo => {
      const preload = new Image();
      preload.src = photo.src;
    });
  }, []);
  async function advancePortrait() {
    const next = (portrait + 1) % portraits.length;
    const photo = portraits[next];
    if (!photo) {
      return;
    }
    const preload = new Image();
    preload.src = photo.src;
    try {
      await preload.decode();
      setPortrait(next);
    } catch {
      /* Keep the current portrait if offline. */
    }
  }

  return (
    <>
      <Section className="home-band">
        <div className="hero">
          <button
            aria-label="Next photo of Reese"
            className="portrait-frame"
            type="button"
            onClick={() => {
              void advancePortrait();
            }}
          >
            {image && (
              <img
                alt={image.alt}
                fetchPriority="high"
                height="733"
                src={image.src}
                style={{ objectPosition: image.position }}
                width="1100"
              />
            )}
          </button>
          <div className="home-intro">
            <h1 tabIndex={-1}>Howdy, I&apos;m Reese!</h1>
            <p>{introduction}</p>
          </div>
        </div>
      </Section>
      <Section tone="deep">
        <h2>Personal projects</h2>
        <div className="three-up">
          {homeProjects.map(project => (
            <a
              key={project.id}
              className="project-tile"
              href={project.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="tile-image">
                <img
                  alt=""
                  height={project.height}
                  loading="lazy"
                  src={project.image}
                  width={project.width}
                />
              </div>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </a>
          ))}
        </div>
        <div className="section-action">
          <Link className="patch" to="/work">
            See all projects
          </Link>
        </div>
      </Section>
      <Section tone="butter">
        <h2>Client work</h2>
        <div className="three-up">
          {clients.slice(0, 3).map(client => (
            <Link key={client.id} className="project-tile" to={`/work#client-${client.id}`}>
              <div className="tile-image">
                <img alt="" height="666" loading="lazy" src={client.image} width="900" />
              </div>
              <h3>{client.title}</h3>
              <p>{(client.description.split(". ")[0] ?? client.description).replace(/\.$/, "")}.</p>
            </Link>
          ))}
        </div>
        <div className="section-action">
          <Link className="patch patch-rose" to="/resume">
            See my resume
          </Link>
        </div>
      </Section>
      <Section>
        <h2>Photos</h2>
        <div className="three-up">
          {events.slice(0, 3).map(event => {
            const cover = coverPhoto(event);
            return (
              <Link key={event.id} className="project-tile" to={`/photos/${event.id}`}>
                <div className="tile-image">
                  <img
                    alt={cover.alt}
                    height={cover.height}
                    loading="lazy"
                    src={cover.thumbnail}
                    width={cover.width}
                  />
                </div>
                <h3>{event.title}</h3>
                <p>{event.year}</p>
              </Link>
            );
          })}
        </div>
        <div className="section-action">
          <Link className="text-link" to="/photos">
            See all photos
          </Link>
        </div>
      </Section>
    </>
  );
}
