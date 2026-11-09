import { useEffect, useState, type CSSProperties, type RefObject } from "react";

import type { Project } from "../data/site";
import { decodeProject, previewRatio } from "../hooks/projectImages";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface PreviewStyle extends CSSProperties {
  "--preview-ratio": number;
}
export function ProjectPreview({
  project,
  frameRef,
}: {
  project: Project;
  frameRef: RefObject<HTMLDivElement | null>;
}) {
  const [layers, setLayers] = useState<{ current: Project; previous?: Project }>({
    current: project,
  });
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  useEffect(() => {
    let cancelled = false;
    void decodeProject(project)
      .then(() => {
        if (cancelled) {
          return;
        }
        setLayers(old =>
          old.current.id === project.id
            ? old
            : { current: project, previous: reduced ? undefined : old.current }
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [project, reduced]);
  useEffect(() => {
    const timer = layers.previous
      ? setTimeout(
          () => {
            setLayers(old => ({ current: old.current }));
          },
          reduced ? 0 : 500
        )
      : undefined;
    return () => {
      clearTimeout(timer);
    };
  }, [layers.current.id, layers.previous, reduced]);
  const style: PreviewStyle = { "--preview-ratio": previewRatio(layers.current) };
  return (
    <aside aria-label="Project preview" className="preview-column">
      <div className="project-preview">
        <div ref={frameRef} className="preview-frame" style={style}>
          {layers.previous && (
            <img
              key={`back-${layers.previous.id}`}
              alt=""
              className="preview-backing"
              height={layers.previous.height}
              src={layers.previous.image}
              width={layers.previous.width}
            />
          )}
          <img
            key={layers.current.id}
            alt={`Screenshot of ${layers.current.title}`}
            className={layers.previous ? "preview-incoming" : ""}
            height={layers.current.height}
            src={layers.current.image}
            width={layers.current.width}
          />
        </div>
      </div>
    </aside>
  );
}
