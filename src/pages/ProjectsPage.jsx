// src/pages/ProjectsPage.jsx
import React from "react";
import "./PageStyles.css"; // Common page styles
import "./ProjectsPage.css"; // Specific styles for this page

// Project Data - this could also be moved to a separate JSON file and imported
const projectsData = [
  {
    id: "moviemap",
    title: "Movie Map",
    path: "/moviemap",
    thumbnail: "/img/projects/moviemap-thumb.jpg",
    description:
      "Visualizing the connections between people's four favorite movies on Letterboxd.",
    tech: ["d3.js", "python"],
    tags: ["data visualization", "letterboxd", "weekend project"],
  },
  {
    id: "matchatab",
    title: "MatchaTab",
    path: "https://addons.mozilla.org/en-US/firefox/addon/matchatab/", // Now links to Firefox Add-ons
    thumbnail: "/img/projects/matchatab-thumb.jpg",
    description:
      "Inspired by Tabliss, this is a customizable new tab page for Firefox browsers.",
    tech: ["javascript", "html", "css"],
    tags: ["browser extension", "weekend project"],
    buttonText: "Install on Firefox",
  },
  {
    id: "brahdb",
    title: "BrahDB",
    path: "/brahdb", // This will be relative to rosematcha.com
    thumbnail: "/img/projects/brahdb-thumb.jpg", // Replace with your actual image path
    description:
      "A visualization tool for the gospel of our greatest food critic, ReportOfTheWeek. Explore reviews and ratings in a dynamic interface.",
    tech: ["vite", "react", "typescript"],
    tags: ["data visualization", "weekend project"],
  },
  {
    id: "bexarvoting",
    title: "Bexar County Voting Data",
    path: "/bexarvoting",
    thumbnail: "/img/projects/bexarvoting-thumb.jpg",
    description:
      "Dissatisfied with the County's lack of transparency, I created a site to visualize historical and present voter turnout data for Bexar County.",
    tech: ["javascript", "chart.js", "tailwindcss"],
    tags: ["data visualization", "civic tech", "weekend project"],
  },
  /*
  {
    id: "decks",
    title: "Pokémon Deck Viewer",
    path: "/decks",
    thumbnail: "/img/projects/decks-thumb.jpg",
    description:
      "An Eleventy-based site for viewing and sharing Pokémon Trading Card Game decks. Card data is parsed from .txt files.",
    tech: ["eleventy (11ty)", "javascript", "tailwindcss"],
    tags: ["static site", "gaming"],
  },
  */
  {
    id: "friendfinder",
    title: "Favorite Film Friend Finder",
    path: "/friendfinder",
    thumbnail: "/img/projects/friendfinder-thumb.jpg",
    description:
      '<a href="https://x.com/rachellapides/status/1868875739732623414" target="_blank" rel="noopener noreferrer">Inspired by a Tweet,</a> a simple tool for finding Letterboxd users with your same top four favorite films.',
    tech: ["javascript", "html", "css"],
    tags: ["static site", "letterboxd", "weekend project"],
  }
  
  // Add more projects here as needed
];

function getProjectUrl(path) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `https://rosematcha.com${path}`;
}

function ProjectsPage() {
  return (
    <div className="page-content">
      <h2 style={{ textAlign: "center" }}>My Projects</h2>
      <p style={{ textAlign: "center", marginBottom: "30px" }}>
        You can't put websites on the fridge, so this is the next best thing.
      </p>

      <div className="project-showcase-container">
        {projectsData.map((project) => (
          <div key={project.id} className="project-entry-card">
            <a
              href={getProjectUrl(project.path)}
              target="_blank"
              rel="noopener noreferrer"
              className="project-thumbnail-link"
            >
              <img
                src={project.thumbnail}
                alt={`${project.title} thumbnail`}
                className="project-thumbnail"
              />
            </a>
            <div className="project-details">
              <h3>
                <a
                  href={getProjectUrl(project.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {project.title}
                </a>
              </h3>
              <p
                className="project-description"
                dangerouslySetInnerHTML={{ __html: project.description }}
              ></p>

              <div className="project-tags">
                <p><strong>Tech:</strong></p>
                <div className="tag-container">
                  {project.tech.map((techItem) => (
                    <span key={techItem} className="tag-badge tech-tag">
                      {techItem}
                    </span>
                  ))}
                </div>
                <p><strong>Categories:</strong></p>
                <div className="tag-container">
                  {project.tags.map((tag) => (
                    <span key={tag} className="tag-badge category-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={getProjectUrl(project.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link-button geocities-button" // Re-use button style
              >
                {project.buttonText || "Visit Project Site"}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectsPage;
