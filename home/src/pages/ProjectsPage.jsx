// src/pages/ProjectsPage.jsx
// Every project in the same sincere row format, filed under tag filters.
import React, { useEffect, useMemo, useState } from "react";
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

// Filter tags shown in the "filed under" line: any tag on 2+ projects.
function usefulTags() {
  const counts = {};
  projectsData.forEach(p => p.tags.forEach(t => (counts[t] = (counts[t] || 0) + 1)));
  return Object.keys(counts)
    .filter(t => counts[t] > 1)
    .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
}

function ProjectRow({ project, index }) {
  const url = getProjectUrl(project.path);
  return (
    <article className={`proj-row ${project.featured ? "proj-row--featured" : ""}`}>
      <a
        className={`shot proj-row__shot ${index % 2 ? "tilt-r" : "tilt-l"}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${project.title}`}
        tabIndex={-1}
      >
        <span className="tape" aria-hidden="true" />
        {isPlaceholderThumb(project.thumbnail) ? (
          <div className="project-placeholder" aria-hidden="true">
            <span>{project.title}</span>
          </div>
        ) : (
          <OptimizedImage
            src={project.thumbnail}
            alt={`${project.title} thumbnail`}
            width={project.thumbnailWidth}
            height={project.thumbnailHeight}
            aspectRatio={3 / 2}
            className="proj-row__img"
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            sizes="(min-width: 700px) 280px, 100vw"
          />
        )}
      </a>
      <div>
        <h3 className="proj-row__name">{project.title}</h3>
        <div className="mono-meta proj-row__meta">
          {[...project.tech, ...project.tags].join(" · ")}
        </div>
        <p className="proj-row__desc" dangerouslySetInnerHTML={{ __html: project.description }} />
        <div className="proj-row__links">
          <a className="link-swipe" href={url} target="_blank" rel="noopener noreferrer">
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
  );
}

function ProjectsPage() {
  const [tag, setTag] = useState(null);
  const tags = useMemo(usefulTags, []);

  useEffect(() => {
    warmProjectsThumbnails();
  }, []);

  const shown = tag ? projectsData.filter(p => p.tags.includes(tag)) : projectsData;

  return (
    <div className="page-content projects-page-wrapper">
      <div className="projects-filed">
        <span className="mono-meta projects-filed__label">filed under</span>
        <button
          type="button"
          className="is-all"
          aria-pressed={tag === null}
          onClick={() => setTag(null)}
        >
          all
        </button>
        {tags.map(t => (
          <button
            key={t}
            type="button"
            aria-pressed={tag === t}
            onClick={() => setTag(current => (current === t ? null : t))}
          >
            {t}
          </button>
        ))}
      </div>
      <hr className="candy-rule projects-rule" />

      <section aria-label="Projects">
        {shown.map((p, i) => (
          <ProjectRow key={p.id} project={p} index={i} />
        ))}
      </section>
    </div>
  );
}

export default ProjectsPage;
