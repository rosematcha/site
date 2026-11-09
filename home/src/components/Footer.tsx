import { useLocation } from "react-router-dom";

import { Section } from "./Section";

export default function Footer() {
  const { pathname } = useLocation();
  return (
    <footer>
      <Section className="contact-band" tone={pathname === "/" ? "rose" : "forest"}>
        <h2>Got something cooking?</h2>
        <p>I&apos;m always down to get involved with cool stuff. Let me lend you my skills!</p>
        <a className="text-link" href="mailto:howdy@rosematcha.com">
          howdy@rosematcha.com
        </a>
      </Section>
    </footer>
  );
}
