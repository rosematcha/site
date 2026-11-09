import { useCallback, useEffect, useRef, type FocusEvent } from "react";

import { ContributionDirectory } from "../components/ContributionDirectory";
import { ProjectPreview } from "../components/ProjectPreview";
import { Section } from "../components/Section";
import { clients, featuredProjects, projects, smallerProjects } from "../data/site";
import { warmProjectImages } from "../hooks/projectImages";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePreviewGeometry } from "../hooks/usePreviewGeometry";
import { useProjectSelection } from "../hooks/useProjectSelection";

export default function ProjectsPage() {
  usePageMeta("Work");
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const layout = useRef<HTMLDivElement>(null);
  const { selected, select, onPointerMove, onPointerLeave } = useProjectSelection(section);
  usePreviewGeometry(section, frame, layout);
  useEffect(() => {
    warmProjectImages(projects);
  }, []);
  const focusProject = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const link = event.target.closest<HTMLElement>("[data-preview-id]");
      const id = link?.dataset.previewId;
      if (!id) {
        return;
      }
      select(id);
      if (window.innerWidth >= 1024) {
        return;
      }
      requestAnimationFrame(() => {
        if (document.activeElement !== link) {
          return;
        }
        const bottom =
          section.current?.querySelector(".preview-column")?.getBoundingClientRect().bottom ?? 0;
        const { top } = link.getBoundingClientRect();
        if (top < bottom + 12) {
          window.scrollBy({ top: top - bottom - 24, behavior: "instant" });
        }
      });
    },
    [select]
  );
  return (
    <>
      <section
        ref={section}
        className="band tone-deep work-band"
        onFocusCapture={focusProject}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
      >
        <div className="section-inner">
          <h1 tabIndex={-1}>Personal projects</h1>
          <div ref={layout} className="project-layout">
            <div className="project-list">
              {featuredProjects.map(project => (
                <a
                  key={project.id}
                  className={`featured-project ${selected.id === project.id ? "is-selected" : ""}`}
                  data-preview-id={project.id}
                  href={project.url}
                  id={`project-${project.id}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <h2>{project.title}</h2>
                  <p>{project.description}</p>
                </a>
              ))}
              <div className="smaller-projects" data-active-project={selected.id}>
                <h2>More projects</h2>
                <ContributionDirectory items={smallerProjects} onActivate={select} />
              </div>
            </div>
            <ProjectPreview frameRef={frame} project={selected} />
          </div>
        </div>
      </section>
      <Section tone="butter">
        <h2>Client work</h2>
        <ContributionDirectory client items={clients} />
      </Section>
    </>
  );
}
