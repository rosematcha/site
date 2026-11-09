import type { ReactNode } from "react";

export function Section({
  children,
  tone = "forest",
  className = "",
  id,
}: {
  children: ReactNode;
  tone?: "forest" | "deep" | "butter" | "rose";
  className?: string;
  id?: string;
}) {
  return (
    <section className={`band tone-${tone} ${className}`} id={id}>
      <div className="section-inner">{children}</div>
    </section>
  );
}
