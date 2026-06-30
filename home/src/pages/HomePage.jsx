import React from "react";
import { Link } from "react-router-dom";
import { Mail, Briefcase, ArrowUpRight } from "lucide-react";
import PolaroidStack from "../components/PolaroidStack";
import OptimizedImage from "../components/OptimizedImage";
import { projectsData } from "../data/projects";
import "./HomePage.css";

const facets = [
  {
    key: "build",
    title: "Build",
    body: "Civic tools, data viz, and sites for nonprofits and small businesses. React, Astro, WordPress.",
    tone: "rose",
  },
  {
    key: "photograph",
    title: "Photograph",
    body: "Pinhole and analog work, plus teaching it to San Antonio youth at UTSA Southwest.",
    tone: "matcha",
  },
  {
    key: "organize",
    title: "Organize",
    body: "Community and labor work: events, outreach, and the tech that keeps them running.",
    tone: "rose-strong",
  },
];

function projectUrl(path) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `https://rosematcha.com${path}`;
}

function HomePage() {
  const selected = projectsData.filter((p) => p.featured).slice(0, 3);

  return (
    <div className="page-content home">
      <section className="hero-section">
        <div className="hero-layout">
          <div className="hero-media">
            <span className="hero-media__ring" aria-hidden="true" />
            <span className="hero-media__dot" aria-hidden="true" />
            <PolaroidStack />
          </div>
          <div className="hero-copy">
            <h1 className="hero-title">
              Howdy,
              <br />
              I'm <span className="hero-title__mark">Reese</span>
            </h1>
            <p className="hero-tagline">
              I'm a developer, photographer, editor, and avid taker of life's side quests. With my
              multidisciplinary background, I create cool tools and experiences for the people and
              causes I care about. Currently teaching pinhole photography{" "}
              <a
                href="https://www.utsa.edu/pace/community-art/youth.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                at UTSA Southwest
              </a>
              , helping computers serve students{" "}
              <a href="https://saysi.org/" target="_blank" rel="noopener noreferrer">
                at SAY Si
              </a>
              , maintaining{" "}
              <a href="https://ciphermaniac.com" target="_blank" rel="noopener noreferrer">
                Ciphermaniac
              </a>
              , and creating civic tech to service{" "}
              <a href="https://rosematcha.com/bexarvoting" target="_blank" rel="noopener noreferrer">
                the voters of Bexar County
              </a>
              .
            </p>
            <div className="hero-actions">
              <Link to="/projects" className="button">
                <Briefcase size={20} />
                View My Work
              </Link>
              <a href="mailto:howdy@rosematcha.com" className="button button--matcha">
                <Mail size={20} />
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="home-facets" aria-label="What I do">
        {facets.map((facet) => (
          <div key={facet.key} className="facet">
            <h2 className={`facet__title facet__title--${facet.tone}`}>{facet.title}</h2>
            <p className="facet__body">{facet.body}</p>
          </div>
        ))}
      </section>

      <section className="home-selected" aria-label="Selected work">
        <div className="home-selected__head">
          <h2>Selected work</h2>
          <Link to="/projects" className="home-selected__all">
            See all projects
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="home-selected__grid">
          {selected.map((project) => (
            <a
              key={project.id}
              href={projectUrl(project.path)}
              target="_blank"
              rel="noopener noreferrer"
              className="work-card"
            >
              <div className="work-card__media">
                <OptimizedImage
                  src={project.thumbnail}
                  alt={`${project.title} thumbnail`}
                  width={project.thumbnailWidth}
                  height={project.thumbnailHeight}
                  className="work-card__img"
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 760px) 33vw, 100vw"
                />
              </div>
              <div className="work-card__body">
                <h3 className="work-card__title">{project.title}</h3>
                <p className="work-card__tags">{project.tags.slice(0, 2).join(" · ")}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <h2 className="home-cta__title">Working on something good?</h2>
        <p className="home-cta__body">
          Civic tech, arts nonprofits, small businesses, and the occasional weekend rabbit hole.
        </p>
        <a href="mailto:howdy@rosematcha.com" className="button">
          <Mail size={20} />
          Get in Touch
        </a>
      </section>
    </div>
  );
}

export default HomePage;
