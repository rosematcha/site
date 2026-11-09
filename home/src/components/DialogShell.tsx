import { useEffect, useRef, useState, type ReactNode } from "react";

import { createPortal } from "react-dom";

import { useMediaQuery } from "../hooks/useMediaQuery";

export function DialogShell({
  children,
  label,
  onDismiss,
  className = "",
  anchor,
  style,
}: {
  children: ReactNode;
  label: string;
  onDismiss: () => void;
  className?: string;
  anchor?: HTMLElement;
  style?: React.CSSProperties;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [closing, setClosing] = useState(false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  useEffect(() => {
    const element = dialog.current;
    if (!element) {
      throw new Error("Dialog element is not mounted");
    }
    const previous = anchor ?? document.activeElement;
    const { overflow } = document.documentElement.style;
    element.showModal();
    document.documentElement.style.overflow = "hidden";
    const focus = () => element.querySelector<HTMLButtonElement>("[data-dialog-focus]")?.focus();
    focus();
    const frame = requestAnimationFrame(focus);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer.current);
      element.close();
      document.documentElement.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [anchor]);
  function dismiss() {
    if (closing) {
      return;
    }
    if (reduced) {
      onDismiss();
      return;
    }
    setClosing(true);
    timer.current = setTimeout(onDismiss, 160);
  }
  return createPortal(
    <dialog
      ref={dialog}
      aria-label={label}
      className={`surface-dialog ${className} ${closing ? "is-closing" : ""}`}
      style={style}
      onCancel={event => {
        event.preventDefault();
        dismiss();
      }}
      onPointerDown={event => {
        if (event.target !== event.currentTarget) {
          return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        ) {
          dismiss();
        }
      }}
    >
      <button
        data-dialog-focus
        className="patch dialog-close"
        type="button"
        onClick={() => {
          dismiss();
        }}
      >
        Close
      </button>
      {children}
    </dialog>,
    document.body
  );
}
