// src/pages/ResumePage.jsx
// The living resume: cream entry cards on the forest stock, filterable by
// featured/all, searchable (matches highlight and auto-reveal), with Reese's
// tag taxonomy cross-linking entries. Printing outputs a plain black-on-white
// resume with everything expanded.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../utils/pageMeta";
import "./ResumePage.css";

/* =============================================================
   Data
   ============================================================= */

// Each role declares which lenses it argues for. The lens chips in the
// toolbar swap which roles lead; nothing is ever removed, since "all" is one
// click away. Display order always follows this array, never the lens, because
// the ordering here is deliberate.
//
// Tags follow Reese's taxonomy (nonprofit, customer service, education,
// photography, sys admin, infrastructure, community building, arts) plus
// job-specific extras. Tags used by only one job render dimmed and
// unclickable — filtering to a single result isn't useful.
const allJobs = [
  {
    id: "saySiAdmin",
    title: "Systems Administrator",
    company: "SAY Sí",
    companyUrl: "https://saysi.org/",
    start: "Jan 2023",
    end: null,
    tags: ["nonprofit", "sys admin", "infrastructure", "arts", "automation"],
    details: [
      "Administer Google Workspace, device management, network access, backups, AV, purchasing, and account permissions.",
      "Maintain and troubleshoot 100+ Windows, macOS, and iOS devices, extending the working life of a resource-constrained lab of 2013 Macs.",
      "Built support processes, automation, documentation, and security practices that made same-day response the norm.",
      "Implemented an inventory system for 500+ assets, enabling more accurate tracking and infrastructure planning.",
    ],
    lenses: ["sysadmin", "web", "arts"],
  },

  {
    id: "stonewallAction",
    title: "Organizer",
    company: "Stonewall Action",
    companyUrl: "https://stonewallaction.org/",
    start: "Mar 2025",
    end: "Feb 2026",
    tags: ["nonprofit", "sys admin", "community building", "wordpress", "event planning"],
    details: [
      "Built and coordinated a 120-person volunteer network to establish a new LGBTQ+ community-action organization.",
      "Produced four community events, coordinating volunteers, guest flow, and promotion.",
      "Designed the organization's WordPress site, graphics, video, and campaign materials.",
      "Developed a custom volunteer check-in and role-assignment tool that replaced paper processes and produced accurate attendance data.",
    ],
    lenses: ["sysadmin", "web"],
  },

  {
    id: "rubyCity",
    title: "Visitor Services Associate",
    company: "Ruby City",
    companyUrl: "https://rubycity.org/",
    start: "May 2025",
    end: null,
    tags: ["nonprofit", "customer service", "community building", "arts"],
    details: [
      "Open and close galleries; monitor visitor safety, gallery conditions, and security, and maintain visitor logs.",
      "Welcome and orient guests through tours and conversations about exhibitions, artists, the collection, and the architecture.",
      "Built an internal, collaborative staff-training system with artwork images, artist data, and comments to support consistent visitor education.",
      "Advocate for accessible visitor experiences and contribute contract website work for the organization.",
    ],
    lenses: ["arts"],
  },

  {
    id: "utsaSouthwest",
    title: "Instructor, Saturday Morning Discovery",
    company: "UTSA Southwest",
    companyUrl: "https://www.utsa.edu/pace/community-art/youth.html",
    start: "May 2023",
    end: null,
    tags: ["education", "photography", "arts", "youth programs"],
    details: [
      "Teach weekly, no-cost photography classes for San Antonio youth and families for roughly nine months each year.",
      "Co-lead analog pinhole-photography instruction, including darkroom film development and printmaking, with other teaching artists.",
      "Independently designed curricula for 3-D photography and DIY iPad photography, introducing youth to camera fundamentals, editing, and accessible creative techniques.",
      "Select course materials and guide students through hands-on projects in a family-centered learning environment.",
    ],
    lenses: ["arts"],
  },

  {
    id: "webDev",
    title: "Contract Web Development",
    company: "Freelance",
    companyUrl: null,
    start: "Jan 2020",
    end: null,
    tags: ["infrastructure", "web development", "accessibility", "open source"],
    details: [
      "Design and maintain accessible, user-friendly websites for clients, utilizing open technologies.",
      "Redesign and rebuild WordPress sites for nonprofits, unions, and small businesses, including migrations off hosted page builders.",
      "Built a bespoke WordPress plugin so non-technical staff can manage featured work without a developer.",
      "Built a members-only portal integrated with Patreon so union members can reach confidential material.",
    ],
    lenses: ["sysadmin", "web"],
  },

  {
    id: "saySiArtist",
    title: "Media Arts Teaching Artist",
    company: "SAY Sí",
    companyUrl: "https://saysi.org/",
    start: "Aug 2018",
    end: "Feb 2025",
    tags: ["nonprofit", "education", "photography", "arts", "youth programs"],
    details: [
      "Taught and mentored a consistent cohort of roughly 20 youth per term in photography, video, Adobe Creative Cloud, and digital storytelling.",
      "Designed project-based curricula and guided students from concept through production, editing, portfolios, public showcases, and festival submissions.",
      "Supported student work recognized with awards at local film festivals.",
      "Managed studio equipment and digital resources; coordinated enrollment, documentation, family communication, and program operations.",
    ],
    lenses: ["arts"],
  },

  {
    id: "bexarParty",
    title: "Office Aide & Voter Information Specialist",
    company: "Bexar County Democratic Party",
    companyUrl: "https://www.bexardemocrat.org/",
    start: "Apr 2024",
    end: "Jan 2025",
    tags: ["nonprofit", "infrastructure", "community building", "civic engagement"],
    details: [
      "Helped voters navigate registration, voting by mail, and election information during the 2024 cycle using VAN and internal voter-data systems.",
      "Maintained and researched voter records across VAN and Access-based internal databases.",
      "Produced voter-facing graphics and election materials, including rapid-turnaround replacements following the July 2024 change in the presidential ticket.",
      "Built a WordPress redesign to improve the party website's accessibility.",
    ],
    lenses: ["web"],
  },

  {
    id: "combatPower",
    title: "Event Organizer & Card Specialist",
    company: "Combat Power Collectibles",
    companyUrl: "https://www.instagram.com/combat_power_gaming/?hl=en",
    start: "Aug 2024",
    end: null,
    tags: ["customer service", "infrastructure", "community building", "gaming"],
    details: [
      "Produce four Pokémon TCG tournaments monthly for approximately 12 players each, managing registration, pairings, prizing, and participant experience.",
      "Build community around recurring play through event marketing and direct player engagement.",
      "Create original promotional flyers and event graphics.",
      "Price, organize, and stock trading-card inventory; assist customers with purchases and product knowledge.",
    ],
    lenses: [],
  },

  {
    id: "photography",
    title: "Freelance Photography",
    company: "Freelance",
    companyUrl: null,
    start: "Oct 2019",
    end: null,
    tags: ["photography", "arts", "event coverage"],
    details: [
      "Provide event photography and digital media creation for diverse clients and occasions.",
    ],
    lenses: [],
  },

  {
    id: "hopVine",
    title: "Operations Manager / Systems Coordinator",
    company: "Hop + Vine",
    companyUrl: null,
    start: "Oct 2019",
    end: "Feb 2021",
    tags: ["infrastructure", "operations", "quickbooks"],
    details: [
      "Processed payroll and maintained financial records for a 12-person restaurant staff using QuickBooks.",
      "Managed inventory and supported day-to-day operations.",
      "Implemented digital solutions for workflow automation and POS systems, providing tech support.",
    ],
    lenses: ["sysadmin"],
  },

  {
    id: "mcDonalds",
    title: "Crew Member",
    company: "McDonald's",
    companyUrl: "https://txmcd.com/",
    start: "Apr 2017",
    end: "Aug 2020",
    tags: ["customer service", "training", "team leadership"],
    details: [
      "Served customers across front counter and drive-thru operations while maintaining a clean, efficient lobby.",
      "Trained new staff on company policies and procedures and answered day-to-day team questions.",
      "Recognized as Employee of the Month four times for customer service and reliability.",
    ],
    lenses: [],
  },
];

// Skills exist so the search box can honour its own placeholder: before this,
// "react" and "python" matched nothing because tools only appeared implicitly,
// inside bullet prose. Every item is evidenced by a role above or a shipped
// project in src/data/projects.js.
const skillGroups = [
  {
    label: "Languages",
    items: ["JavaScript", "TypeScript", "PHP", "Python", "Lua", "HTML", "CSS"],
  },
  {
    label: "Web",
    items: [
      "React",
      "Astro",
      "Node.js",
      "WordPress",
      "Vite",
      "Tailwind CSS",
      "Netlify",
      "Git",
      "accessibility",
    ],
  },
  {
    label: "Data & automation",
    items: ["D3.js", "Chart.js", "Playwright", "web scraping", "OCR"],
  },
  {
    label: "Systems",
    items: [
      "Google Workspace",
      "macOS",
      "Windows",
      "iOS",
      "device management",
      "networking",
      "backups",
      "AV",
      "asset inventory",
    ],
  },
  {
    label: "Creative",
    items: [
      "Adobe Creative Cloud",
      "photography",
      "darkroom and film development",
      "pinhole",
      "printmaking",
      "video",
    ],
  },
  {
    label: "Operations",
    items: [
      "QuickBooks",
      "payroll",
      "POS",
      "VAN",
      "Microsoft Access",
      "event production",
      "curriculum design",
    ],
  },
];

// The three lenses Reese actually applies under, plus the escape hatch. The
// active lens rides in ?lens= so a targeted link can be pasted straight into
// an application and land on the roles that argue for that job.
const LENSES = [
  { id: "sysadmin", label: "sysadmin" },
  { id: "web", label: "web" },
  { id: "arts", label: "arts + ed" },
  { id: "all", label: "all" },
];

const DEFAULT_LENS = "sysadmin";

const educationData = {
  degree: "Associate of Science, Computer Science",
  school: "Northwest Vista College, San Antonio TX",
  year: "2023",
};

const TAG_COUNTS = allJobs.reduce((counts, job) => {
  job.tags.forEach(tag => {
    counts[tag] = (counts[tag] || 0) + 1;
  });
  return counts;
}, {});

/* =============================================================
   Helpers
   ============================================================= */

function skillsMatch(query) {
  if (!query) return false;
  return skillGroups.some(group => group.items.some(item => item.toLowerCase().includes(query)));
}

function readLens(searchParams) {
  const requested = searchParams.get("lens");
  return LENSES.some(l => l.id === requested) ? requested : DEFAULT_LENS;
}

function inLens(job, lens) {
  return lens === "all" || job.lenses.includes(lens);
}

function jobText(job) {
  return `${job.title} ${job.company} ${job.tags.join(" ")} ${job.details.join(" ")}`.toLowerCase();
}

function Highlight({ text, query }) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? <mark key={i}>{part}</mark> : part
  );
}

/* =============================================================
   Entry
   ============================================================= */

function JobEntry({ job, index, isOpen, onToggle, query, activeTag, onTagClick, compact }) {
  const dates = (
    <>
      {job.start} – {job.end === null ? <span className="resume-now">present</span> : job.end}
    </>
  );

  return (
    <div
      className={`resume-entry ${index % 2 ? "tilt-r-sm" : "tilt-l-sm"} ${isOpen ? "resume-entry--open" : ""}`}
    >
      {/* The head is a plain grid, not a button. The toggle button wraps only
          the title and stretches an ::after overlay across the whole head, so
          the entire card stays clickable without nesting the company link
          inside a button (invalid HTML, and axe's nested-interactive). The
          link sits above the overlay via z-index. */}
      <div className="resume-entry__head">
        <button
          type="button"
          className="resume-entry__toggler"
          aria-expanded={isOpen}
          aria-label={`${job.title}, ${job.company}`}
          onClick={onToggle}
        >
          <span className="resume-entry__title">
            <Highlight text={job.title} query={query} />
          </span>
        </button>
        <div className="resume-entry__org">
          {job.companyUrl ? (
            <a href={job.companyUrl} target="_blank" rel="noopener noreferrer">
              <Highlight text={job.company} query={query} />
            </a>
          ) : (
            <Highlight text={job.company} query={query} />
          )}
        </div>
        <div className="resume-entry__dates mono-meta">{dates}</div>
        <span className="resume-entry__toggle" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </div>
      {!compact && (
        <div className="resume-entry__tags">
          {job.tags.map(tag =>
            TAG_COUNTS[tag] > 1 ? (
              <button
                key={tag}
                type="button"
                className={`resume-tag resume-tag--clickable ${activeTag === tag ? "is-on" : ""}`}
                onClick={() => onTagClick(tag)}
              >
                <Highlight text={tag} query={query} />
              </button>
            ) : (
              <span key={tag} className="resume-tag resume-tag--solo" title="only used once">
                <Highlight text={tag} query={query} />
              </span>
            )
          )}
        </div>
      )}
      {/* Fade mode: height snaps in one reflow, then the body fades and
          slides on the GPU. Chosen over animated height for Firefox. */}
      <div className={`resume-entry__bodywrap ${isOpen ? "is-open" : ""}`}>
        <ul className="resume-entry__body">
          {job.details.map((detail, i) => (
            <li key={i}>
              <Highlight text={detail} query={query} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SkillsBlock({ query }) {
  return (
    <dl className="resume-skills tilt-l-sm">
      {skillGroups.map(group => (
        <React.Fragment key={group.label}>
          <dt className="resume-skills__label">{group.label}</dt>
          <dd className="resume-skills__items">
            {group.items.map((item, i) => (
              <React.Fragment key={item}>
                {i > 0 && ", "}
                <Highlight text={item} query={query} />
              </React.Fragment>
            ))}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/* =============================================================
   Page
   ============================================================= */

// The confirmation is shorter than the address it replaces, so the button
// holds its label's width: in the mono rail 1ch is one glyph, and without a
// reserved width the links to its right slide under the pointer mid-click.
function CopyLink({ id, label, value, copied, onCopy }) {
  return (
    <button
      type="button"
      style={{ minWidth: `${label.length}ch` }}
      onClick={() => onCopy(value, id)}
    >
      {copied === id ? "copied!" : label}
    </button>
  );
}

CopyLink.propTypes = {
  copied: PropTypes.string,
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onCopy: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

function ResumePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const lens = readLens(searchParams);
  const [activeTag, setActiveTag] = useState(null);
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState(() => new Set());
  const [allOpen, setAllOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [copied, setCopied] = useState(null);
  const searchRef = useRef(null);

  usePageTitle("Resume");

  const q = query.trim().toLowerCase();

  // Printing deliberately follows the lens rather than dumping all eleven
  // roles: the PDF someone attaches to an application should be the same
  // argument the page is making on screen.
  const shown = useMemo(
    () =>
      allJobs.filter(job => {
        if (activeTag && !job.tags.includes(activeTag)) return false;
        // A query searches the whole history. Scoping it to the active lens
        // meant "quickbooks" and "VAN" reported no match on first load even
        // though those entries exist.
        if (q) return jobText(job).includes(q);
        if (activeTag) return true;
        return inLens(job, lens);
      }),
    [lens, activeTag, q]
  );

  const skillHit = useMemo(() => skillsMatch(q), [q]);

  const isOpen = useCallback(
    job =>
      printing ||
      allOpen ||
      openIds.has(job.id) ||
      (Boolean(q) && job.details.join(" ").toLowerCase().includes(q)),
    [printing, allOpen, openIds, q]
  );

  const toggleEntry = useCallback(id => {
    setAllOpen(false);
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleTagClick = useCallback(tag => {
    setActiveTag(current => (current === tag ? null : tag));
  }, []);

  const selectLens = useCallback(
    id => {
      setActiveTag(null);
      setQuery("");
      const next = new URLSearchParams(searchParams);
      next.set("lens", id);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1400);
    });
  };

  useEffect(() => {
    const before = () => setPrinting(true);
    const after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    const onKey = event => {
      if (event.key === "/" && document.activeElement !== searchRef.current) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="page-content resume-page">
      <div className="resume-idcard tilt-l-sm">
        <span className="tape" aria-hidden="true" />
        <div className="resume-idcard__top">
          <h1 className="resume-idcard__name">Reese Lundquist</h1>
          <button type="button" className="resume-pdf" onClick={() => window.print()}>
            print / PDF
          </button>
        </div>
        <div className="resume-idcard__role">
          {
            "Systems administrator\u00a0· developer\u00a0· photographer\u00a0· organizer\u00a0· teacher"
          }
        </div>
        <div className="resume-idcard__where">
          {"San Antonio, TX\u00a0· available locally or remote\u00a0· open to freelance"}
        </div>
        <div className="resume-idcard__rail mono-meta">
          <CopyLink
            id="email"
            label="howdy@rosematcha.com"
            value="howdy@rosematcha.com"
            copied={copied}
            onCopy={copyToClipboard}
          />
          <a href="https://github.com/rosematcha" target="_blank" rel="noopener noreferrer">
            github.com/rosematcha
          </a>
          <CopyLink
            id="site"
            label="rosematcha.com"
            value="https://rosematcha.com"
            copied={copied}
            onCopy={copyToClipboard}
          />
          <Link to="/projects">rosematcha.com/projects</Link>
        </div>
      </div>

      <div className="resume-toolbar">
        {LENSES.map(item => (
          <React.Fragment key={item.id}>
            {/* "all" sits behind a rule so it reads as leaving the lens
                rather than being a fourth one. */}
            {item.id === "all" && <span className="resume-lens__sep" aria-hidden="true" />}
            <button
              type="button"
              className={`resume-lens ${item.id === "all" ? "resume-lens--all" : ""}`}
              aria-pressed={lens === item.id && !activeTag && !q}
              onClick={() => selectLens(item.id)}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
        <span className="resume-searchwrap">
          <input
            ref={searchRef}
            className="resume-search"
            type="text"
            placeholder="search skills, tools…"
            aria-label="Search resume"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span className="resume-slash" aria-hidden="true">
            /
          </span>
        </span>
      </div>

      <div className="resume-util mono-meta">
        <span>
          showing <b>{shown.length}</b> of {allJobs.length}
        </span>
        <button
          type="button"
          onClick={() => {
            setAllOpen(open => !open);
            setOpenIds(new Set());
          }}
        >
          {allOpen ? "collapse all" : "expand all"}
        </button>
        <button type="button" onClick={() => setCompact(c => !c)}>
          {compact ? "detailed view" : "compact view"}
        </button>
        {activeTag && (
          <span className="resume-activetag">
            filtered by{" "}
            <b>
              {activeTag} ({TAG_COUNTS[activeTag]})
            </b>{" "}
            ·{" "}
            <button type="button" onClick={() => setActiveTag(null)}>
              clear
            </button>
          </span>
        )}
      </div>

      <h2 className="resume-printhead">Experience</h2>
      {shown.length === 0 && !skillHit ? (
        <div className="resume-empty scrap">
          Nothing matches that.{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              selectLens("all");
            }}
          >
            start over
          </button>
        </div>
      ) : (
        <div>
          {shown.map((job, index) => (
            <JobEntry
              key={job.id}
              job={job}
              index={index}
              isOpen={isOpen(job)}
              onToggle={() => toggleEntry(job.id)}
              query={q}
              activeTag={activeTag}
              onTagClick={handleTagClick}
              compact={compact}
            />
          ))}
        </div>
      )}

      <h2 className="resume-printhead">Skills</h2>
      <SkillsBlock query={q} />

      <h2 className="resume-printhead">Education</h2>
      <div className="resume-edu tilt-r-sm">
        <span>
          <strong>{educationData.degree}</strong> · {educationData.school}
        </span>
        <span className="mono-meta">{educationData.year}</span>
      </div>
    </div>
  );
}

export default ResumePage;
