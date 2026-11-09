import { Fragment, useState } from "react";

import { useSearchParams } from "react-router-dom";

import { ContributionDirectory } from "../components/ContributionDirectory";
import { Section } from "../components/Section";
import { clients, jobs, projects, skills, type Job } from "../data/site";
import { usePageMeta } from "../hooks/usePageMeta";

const lenses = [
  { id: "sysadmin", label: "Sysadmin" },
  { id: "web", label: "Web" },
  { id: "arts", label: "Arts + ed" },
  { id: "all", label: "All" },
];
function highlightParts(text: string, query: string) {
  const expression = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
  const parts: { text: string; marked: boolean; offset: number }[] = [];
  let cursor = 0;
  for (const match of text.matchAll(expression)) {
    if (cursor < match.index) {
      parts.push({ text: text.slice(cursor, match.index), marked: false, offset: cursor });
    }
    parts.push({ text: match[0], marked: true, offset: match.index });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), marked: false, offset: cursor });
  }
  return parts;
}
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) {
    return <>{text}</>;
  }
  return (
    <>
      {highlightParts(text, query).map(part =>
        part.marked ? (
          <mark key={part.offset}>{part.text}</mark>
        ) : (
          <Fragment key={part.offset}>{part.text}</Fragment>
        )
      )}
    </>
  );
}
function matchesJob(job: Job, query: string, lens: string): boolean {
  if (query) {
    return [job.title, job.company, ...job.tags, ...job.details]
      .join(" ")
      .toLowerCase()
      .includes(query);
  }
  return lens === "all" || job.lenses.includes(lens);
}
function JobEntry({ job, query }: { job: Job; query: string }) {
  return (
    <article className="resume-job">
      <p className="job-dates">
        {job.start} – {job.end ?? "present"}
      </p>
      <div>
        <h3>
          <Highlight query={query} text={job.title} />
        </h3>
        <p className="job-company">
          <Highlight query={query} text={job.company} />
        </p>
        <ul>
          {job.details.map(detail => (
            <li key={detail}>
              <Highlight query={query} text={detail} />
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
export default function ResumePage() {
  usePageMeta("Resume");
  const [params, setParams] = useSearchParams();
  const requested = params.get("lens") ?? "all";
  const lens = lenses.some(item => item.id === requested) ? requested : "all";
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = jobs.filter(job => matchesJob(job, q, lens));
  function selectLens(id: string) {
    setQuery("");
    const next = new URLSearchParams(params);
    next.set("lens", id);
    setParams(next, { replace: true, preventScrollReset: true });
  }
  return (
    <>
      <Section className="resume-intro">
        <h1 tabIndex={-1}>Reese Lundquist</h1>
        <p className="role-line">
          Developer · systems administrator · photographer · organizer · teacher
        </p>
        <p>San Antonio, TX · available locally or remote · open to freelance</p>
        <div className="resume-rail">
          <a className="text-link" href="mailto:howdy@rosematcha.com">
            howdy@rosematcha.com
          </a>
          <a className="text-link" href="https://github.com/rosematcha">
            github.com/rosematcha
          </a>
          <button
            className="patch print-button"
            type="button"
            onClick={() => {
              window.print();
            }}
          >
            Print / PDF
          </button>
          <span className="print-site">rosematcha.com</span>
        </div>
      </Section>
      <Section tone="deep">
        <h2>Experience</h2>
        <div className="resume-tools">
          <div aria-label="Experience filter" className="lens-buttons" role="group">
            {lenses.map(item => (
              <button
                key={item.id}
                aria-pressed={lens === item.id && !q}
                className="patch"
                type="button"
                onClick={() => {
                  selectLens(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            aria-label="Search resume"
            className="field resume-search"
            placeholder="search skills, tools..."
            type="search"
            value={query}
            onChange={event => {
              setQuery(event.target.value);
            }}
          />
        </div>
        <p className="sr-only" role="status">
          {shown.length} of {jobs.length} roles
        </p>
        <div className="resume-stack">
          {shown.map(job => (
            <JobEntry key={`${job.title}-${job.company}`} job={job} query={q} />
          ))}
          {!shown.length && <p role="status">No roles match.</p>}
        </div>
      </Section>
      <Section tone="butter">
        <div className="resume-directories">
          <div>
            <h2>Client work</h2>
            <ContributionDirectory client fromResume items={clients} />
          </div>
          <div>
            <h2>Personal projects</h2>
            <ContributionDirectory fromResume items={projects} />
          </div>
        </div>
      </Section>
      <Section>
        <div className="skills-education">
          <div>
            <h2>Skills</h2>
            <dl className="skills">
              {skills.map(group => (
                <Fragment key={group.label}>
                  <dt>{group.label}</dt>
                  <dd>
                    {group.items.map((item, i) => (
                      <Fragment key={item}>
                        {i > 0 && ", "}
                        <Highlight query={q} text={item} />
                      </Fragment>
                    ))}
                  </dd>
                </Fragment>
              ))}
            </dl>
          </div>
          <div>
            <h2>Education</h2>
            <p>
              <strong>Associate of Science, Computer Science</strong>
              <br />
              Northwest Vista College, San Antonio TX, 2023
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
