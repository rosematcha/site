import React from "react";
import { Link } from "react-router-dom";
import PolaroidStack from "../components/PolaroidStack";
import OptimizedImage from "../components/OptimizedImage";
import { projectsData } from "../data/projects";
import "./HomePage.css";

const facets = [
  {
    key: "build",
    title: "Build",
    body: "Civic tools, data viz, and sites for nonprofits and small businesses. React, Astro, WordPress.",
    stock: "",
  },
  {
    key: "photograph",
    title: "Photograph",
    body: "Pinhole and analog work, plus teaching it to San Antonio youth at UTSA Southwest.",
    stock: "scrap--butter",
  },
  {
    key: "organize",
    title: "Organize",
    body: "Community and labor work: events, outreach, and the tech that keeps them running.",
    stock: "scrap--mint",
  },
];

function projectUrl(path) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `https://rosematcha.com${path}`;
}

function HomePage() {
  const selected = projectsData.filter(p => p.featured).slice(0, 3);

  return (
    <div className="page-content home">
      <section className="home-top" aria-label="Introduction">
        <div className="home-top__left">
          <div className="home-hero__scrap scrap scrap--deckle">
            <span className="tape" aria-hidden="true" />
            <p>
              Howdy, I'm Reese! I'm a web developer, educator, and photographer passionate about
              making cool things. I'm currently teaching pinhole photography{" "}
              <a
                className="link-swipe"
                href="https://www.utsa.edu/pace/community-art/youth.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                at UTSA
              </a>
              , administering tech{" "}
              <a
                className="link-swipe"
                href="https://saysi.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                at SAY Sí
              </a>
              , maintaining too many personal projects, and protecting artwork at{" "}
              <a
                className="link-swipe"
                href="https://rubycity.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ruby City
              </a>
              .
            </p>
          </div>
          <div className="home-facets">
            {facets.map(facet => (
              <div key={facet.key} className={`scrap ${facet.stock} home-facet`}>
                <h2 className="home-facet__title">{facet.title}</h2>
                <p className="home-facet__body">{facet.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="home-top__right tilt-r">
          <PolaroidStack />
        </div>
      </section>

      {/* Still pending your picks: darkroom strip (needs pinhole scans),
          elsewhere links (needs account list), guestbook teaser. */}

      <section className="home-selected" aria-label="Selected work">
        <div className="home-selected__head">
          <h2 className="section-title home-selected__title">Selected work</h2>
          <Link to="/projects" className="button button--cream home-selected__all">
            see all projects →
          </Link>
        </div>
        <hr className="candy-rule home-selected__rule" />
        {selected.map((project, index) => (
          <article key={project.id} className="home-proj">
            <a
              className={`shot home-proj__shot ${index % 2 ? "tilt-r" : "tilt-l"}`}
              href={projectUrl(project.path)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${project.title}`}
              tabIndex={-1}
            >
              <span className="tape" aria-hidden="true" />
              <OptimizedImage
                src={project.thumbnail}
                alt={`${project.title} thumbnail`}
                width={project.thumbnailWidth}
                height={project.thumbnailHeight}
                aspectRatio={3 / 2}
                className="home-proj__img"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                sizes="(min-width: 700px) 220px, 100vw"
              />
            </a>
            <div className="home-proj__body">
              <h3 className="home-proj__name">{project.title}</h3>
              <div className="mono-meta home-proj__meta">
                {[...project.tech, ...project.tags].slice(0, 4).join(" · ")}
              </div>
              <p
                className="home-proj__desc"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
              <div className="home-proj__links">
                <a
                  className="link-swipe"
                  href={projectUrl(project.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {project.buttonText || "visit site"} ↗
                </a>
                {project.github && (
                  <a
                    className="link-swipe"
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github ↗
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="home-cta tilt-l-sm" aria-label="Work with me">
        <span className="tape" aria-hidden="true" />
        <h2 className="home-cta__title">Got something cooking?</h2>
        <p className="home-cta__body">
          I'm always down to get involved with cool stuff. Let me lend you my skills!
        </p>
        <div className="home-cta__actions">
          <a href="mailto:howdy@rosematcha.com" className="button button--cream home-cta__button">
            howdy@rosematcha.com
          </a>
          <Link to="/guestbook" className="home-cta__aside">
            or just sign the guestbook →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
