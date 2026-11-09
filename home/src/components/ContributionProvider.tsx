import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import { ContributionContext, type NoteRequest } from "./contributionContext";
import { DialogShell } from "./DialogShell";

interface NoteStyle extends CSSProperties {
  "--note-content-height"?: string;
}
function surfaceMetrics(content: HTMLDivElement | null, modal: boolean) {
  const surface = modal ? content?.closest("dialog") : content;
  const measured = surface?.getBoundingClientRect().height ?? 0;
  return {
    height: measured || 220,
    chrome: measured ? measured - (content?.getBoundingClientRect().height ?? 0) : 96,
  };
}
function modalBounds(request: NoteRequest, metrics: { height: number; chrome: number }) {
  let rect = request.anchor.getBoundingClientRect();
  const gap = () => Math.max(rect.top - 24, window.innerHeight - rect.bottom - 24);
  if (metrics.height > gap()) {
    const target = Math.max(12, (window.innerHeight - metrics.height - rect.height - 24) / 2);
    window.scrollBy({ top: rect.top - target, behavior: "instant" });
    rect = request.anchor.getBoundingClientRect();
  }
  const copyHeight = Math.max(32, gap() - metrics.chrome);
  return { rect, height: Math.min(metrics.height, copyHeight + metrics.chrome), copyHeight };
}
function useNotePosition(request: NoteRequest, modal: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<NoteStyle>({ visibility: "hidden" });
  const [echo, setEcho] = useState<CSSProperties>({ visibility: "hidden" });
  useLayoutEffect(() => {
    function place() {
      const metrics = surfaceMetrics(ref.current, modal);
      const bounds = modal
        ? modalBounds(request, metrics)
        : {
            rect: request.anchor.getBoundingClientRect(),
            height: metrics.height,
            copyHeight: window.innerHeight - 48,
          };
      const { rect, height } = bounds;
      const width = Math.min(368, window.innerWidth - 24);
      const bandBottom =
        request.anchor.closest(".band")?.getBoundingClientRect().bottom ?? window.innerHeight;
      const bottom = modal ? window.innerHeight : Math.min(window.innerHeight, bandBottom);
      const below = rect.bottom + 10;
      const top = below + height <= bottom - 12 ? below : rect.top - height - 10;
      setPosition({
        "--note-content-height": `${String(bounds.copyHeight)}px`,
        width,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
        top: Math.max(12, Math.min(top, window.innerHeight - height - 12)),
      });
      setEcho({
        left: rect.left - 6,
        top: rect.top - 4,
        width: rect.width + 12,
        minHeight: Math.max(44, rect.height + 8),
      });
    }
    place();
    const frame = requestAnimationFrame(place);
    const surface = modal ? ref.current?.closest("dialog") : ref.current;
    const observer = new ResizeObserver(place);
    if (surface) {
      observer.observe(surface);
    }
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [request, modal]);
  return { ref, position, echo };
}
function ContributionNote({
  request,
  modal,
  onDismiss,
  cancelClose,
  scheduleClose,
}: {
  request: NoteRequest;
  modal: boolean;
  onDismiss: () => void;
  cancelClose: () => void;
  scheduleClose: () => void;
}) {
  const { ref, position, echo } = useNotePosition(request, modal);
  if (!modal) {
    return createPortal(
      <div
        ref={ref}
        className="contribution-note"
        id="contribution-note"
        role="tooltip"
        style={position}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
      >
        {request.item.description}
      </div>,
      document.body
    );
  }
  const action = request.external ? (
    <a
      className="text-link"
      href={request.href}
      rel="noopener noreferrer"
      target="_blank"
      onClick={onDismiss}
    >
      {request.action}
    </a>
  ) : (
    <Link className="text-link" to={request.href} onClick={onDismiss}>
      {request.action}
    </Link>
  );
  return (
    <DialogShell
      anchor={request.anchor}
      className="spotlight-note"
      label={`About ${request.item.title}`}
      style={position}
      onDismiss={onDismiss}
    >
      <span aria-hidden="true" className="spotlight-echo" style={echo}>
        {request.item.title}
      </span>
      <div ref={ref} className="note-content">
        <h2>{request.item.title}</h2>
        <p>{request.item.description}</p>
        {action}
      </div>
    </DialogShell>
  );
}
export function ContributionProvider({ children }: { children: ReactNode }) {
  const [note, setNote] = useState<{ request: NoteRequest; modal: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelClose = useCallback(() => {
    clearTimeout(timer.current);
  }, []);
  const dismiss = useCallback(() => {
    cancelClose();
    setNote(null);
  }, [cancelClose]);
  const scheduleClose = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setNote(current => (current?.modal ? current : null));
    }, 160);
  }, []);
  const show = useCallback((request: NoteRequest, modal: boolean) => {
    clearTimeout(timer.current);
    if (modal && request.anchor.getBoundingClientRect().bottom > window.innerHeight - 280) {
      request.anchor.scrollIntoView({ block: "center", behavior: "instant" });
    }
    setNote({ request, modal });
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !note?.modal) {
        dismiss();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(timer.current);
    };
  }, [dismiss, note?.modal]);
  const api = useMemo(
    () => ({
      anchor: note && !note.modal ? note.request.anchor : null,
      show,
      scheduleClose,
      cancelClose,
      dismiss,
    }),
    [note, show, scheduleClose, cancelClose, dismiss]
  );
  return (
    <ContributionContext.Provider value={api}>
      {children}
      {note && (
        <ContributionNote
          key={`${note.request.item.id}-${String(note.modal)}`}
          cancelClose={cancelClose}
          modal={note.modal}
          request={note.request}
          scheduleClose={scheduleClose}
          onDismiss={dismiss}
        />
      )}
    </ContributionContext.Provider>
  );
}
