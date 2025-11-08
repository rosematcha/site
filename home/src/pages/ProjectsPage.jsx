// src/pages/ProjectsPage.jsx
import React, { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { projectsData } from "../data/projects";
import { warmProjectsThumbnails } from "../utils/prefetch";
import OptimizedImage from "../components/OptimizedImage";
import "./ProjectsPage.css";

function getProjectUrl(path) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `https://rosematcha.com${path}`;
}

function ProjectsPage() {
  useEffect(() => {
    // Ensure warming kicks off even on direct loads or fast clicks
    warmProjectsThumbnails();
  }, []);

  return (
    <div className="projects-page-wrapper">
      <div className="projects-header">
        <h2>My Projects</h2>
        <p>You can't put websites on the fridge, so this is the next best thing.</p>
      </div>

      <div className="project-showcase-container">
        {projectsData.map((project, idx) => (
          <div key={project.id} className="project-entry-card">
            <a
              href={getProjectUrl(project.path)}
              target="_blank"
              rel="noopener noreferrer"
              className="project-thumbnail-link"
            >
              <OptimizedImage
                src={project.thumbnail}
                alt={`${project.title} thumbnail`}
                width={project.thumbnailWidth}
                height={project.thumbnailHeight}
                className="project-thumbnail"
                loading={idx < 2 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={idx < 2 ? "high" : "auto"}
                sizes="(min-width: 900px) 36vw, 100vw"
                placeholder={
                  <div className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded">
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      Loading...
                    </div>
                  </div>
                }
              />
            </a>
            <div className="project-details">
              <div>
                <h3>
                  <a href={getProjectUrl(project.path)} target="_blank" rel="noopener noreferrer">
                    {project.title}
                  </a>
                </h3>
                <p
                  className="project-description"
                  dangerouslySetInnerHTML={{ __html: project.description }}
                ></p>

                <a
                  href={getProjectUrl(project.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link-button button"
                >
                  <ExternalLink size={16} />
                  {project.buttonText || "Visit Project Site"}
                </a>
              </div>

              <div className="project-tags-row" aria-label="Project tags">
                {project.tech.map((techItem, i) => (
                  <span key={`tech-${i}-${techItem}`} className="tag-badge tech-tag">
                    {techItem}
                  </span>
                ))}
                {project.tags.map((tag, i) => (
                  <span key={`cat-${i}-${tag}`} className="tag-badge category-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectsPage;
