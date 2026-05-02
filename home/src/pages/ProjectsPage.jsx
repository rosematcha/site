// src/pages/ProjectsPage.jsx
// Featured projects: full-width 50/50 panels alternating image side, numbered.
// Lesser projects: condensed single-column rows with thumb + 2-line desc + tags + visit button.
import React, { useEffect } from "react";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { projectsData } from "../data/projects";
import { warmProjectsThumbnails } from "../utils/prefetch";
import OptimizedImage from "../components/OptimizedImage";
import "./ProjectsPage.css";

function getProjectUrl(path) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `https://rosematcha.com${path}`;
}

function isPlaceholderThumb(src) {
  return typeof src === "string" && src.includes("placeholder-thumb");
}

function Thumb({ project, eager, sizes, hideName }) {
  if (isPlaceholderThumb(project.thumbnail)) {
    return (
      <div className="project-placeholder" aria-hidden="true">
        {!hideName && <span className="project-placeholder__name">{project.title}</span>}
      </div>
    );
  }
  return (
    <OptimizedImage
      src={project.thumbnail}
      alt={`${project.title} thumbnail`}
      width={project.thumbnailWidth}
      height={project.thumbnailHeight}
      className="project-thumb-img"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      sizes={sizes || "(min-width: 900px) 50vw, 100vw"}
    />
  );
}

function Tags({ project, total = 5 }) {
  // Tech tags get priority. Fill remaining slots with category tags.
  const tech = project.tech.slice(0, total);
  const cats = project.tags.slice(0, Math.max(0, total - tech.length));
  return (
    <div className="project-tags">
      {tech.map((t, i) => (
        <span key={`t-${i}`} className="project-tag project-tag--tech">{t}</span>
      ))}
      {cats.map((t, i) => (
        <span key={`c-${i}`} className="project-tag project-tag--cat">{t}</span>
      ))}
    </div>
  );
}

function FeaturedCard({ project, index, eager }) {
  const url = getProjectUrl(project.path);
  return (
    <article className={`project-feature ${index % 2 ? "project-feature--reverse" : ""}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="project-feature__media"
        aria-label={`Visit ${project.title}`}
        tabIndex={-1}
      >
        <Thumb project={project} eager={eager} sizes="(min-width: 900px) 50vw, 100vw" />
      </a>
      <div className="project-feature__body">
        <h3 className="project-title project-title--lg">
          <a href={url} target="_blank" rel="noopener noreferrer">{project.title}</a>
        </h3>
        <p
          className="project-desc"
          dangerouslySetInnerHTML={{ __html: project.description }}
        />
        <Tags project={project} total={5} />
        <a href={url} target="_blank" rel="noopener noreferrer" className="project-visit">
          <ExternalLink size={14} aria-hidden="true" />
          <span>{project.buttonText || "Visit Project Site"}</span>
        </a>
      </div>
    </article>
  );
}

function LesserRow({ project }) {
  const url = getProjectUrl(project.path);
  return (
    <article className="project-row">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="project-row__media"
        aria-label={`Visit ${project.title}`}
        tabIndex={-1}
      >
        <Thumb project={project} sizes="200px" hideName />
      </a>
      <div className="project-row__main">
        <h4 className="project-title project-title--sm">
          <a href={url} target="_blank" rel="noopener noreferrer">{project.title}</a>
        </h4>
        <p
          className="project-desc"
          dangerouslySetInnerHTML={{ __html: project.description }}
        />
        <div className="project-row__footer">
          <Tags project={project} total={4} />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="project-visit project-visit--sm project-visit--ghost"
          >
            <span>{project.buttonText || "Visit Project Site"}</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

function ProjectsPage() {
  useEffect(() => {
    warmProjectsThumbnails();
  }, []);

  const featured = projectsData.filter((p) => p.featured);
  const lessers = projectsData.filter((p) => !p.featured);

  return (
    <div className="projects-page-wrapper">
      <div className="projects-header">
        <h2>My Projects</h2>
      </div>

      <section className="project-section" aria-label="Featured projects">
        <div className="project-features">
          {featured.map((p, i) => (
            <FeaturedCard key={p.id} project={p} index={i} eager={i < 2} />
          ))}
        </div>
      </section>

      <section className="project-section project-section--lesser" aria-label="More projects">
        <ul className="project-rows">
          {lessers.map((p) => (
            <li key={p.id} className="project-rows__item">
              <LesserRow project={p} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ProjectsPage;
