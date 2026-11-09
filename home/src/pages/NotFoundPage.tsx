import { Link } from "react-router-dom";

import { Section } from "../components/Section";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFoundPage() {
  usePageMeta("Page not found");
  return (
    <Section>
      <h1 tabIndex={-1}>Page not found</h1>
      <Link className="patch" to="/">
        Go home
      </Link>
    </Section>
  );
}
