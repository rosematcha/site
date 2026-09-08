// src/pages/ResumePage.jsx
// The living resume: cream entry cards on the forest stock, filterable by
// featured/all, searchable (matches highlight and auto-reveal), with Reese's
// tag taxonomy cross-linking entries. Printing outputs a plain black-on-white
// resume with everything expanded.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ResumePage.css";

/* =============================================================
   Data
   ============================================================= */

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
    featured: true,
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
    featured: true,
  },
  {
    id: "utsaSouthwest",
    title: "Instructor, Saturday Morning Discovery",
    company: "UTSA Southwest",
    companyUrl: null,
    start: "May 2023",
    end: null,
    tags: ["education", "photography", "arts", "youth programs"],
    details: [
      "Teach weekly, no-cost photography classes for San Antonio youth and families for roughly nine months each year.",
      "Co-lead analog pinhole-photography instruction, including darkroom film development and printmaking, with other teaching artists.",
      "Independently designed curricula for 3-D photography and DIY iPad photography, introducing youth to camera fundamentals, editing, and accessible creative techniques.",
      "Select course materials and guide students through hands-on projects in a family-centered learning environment.",
    ],
    featured: true,
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
      "Teach and mentor a consistent cohort of roughly 20 youth per term in photography, video, Adobe Creative Cloud, and digital storytelling.",
      "Design project-based curricula and guide students from concept through production, editing, portfolios, public showcases, and festival submissions.",
      "Supported student work recognized with awards at local film festivals.",
      "Manage studio equipment and digital resources; coordinate enrollment, documentation, family communication, and program operations.",
    ],
    featured: false,
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
    featured: false,
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
    featured: false,
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
    featured: false,
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
    ],
    featured: false,
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
    featured: false,
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
    featured: false,
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
    featured: true,
  },
];

const educationData = {
  degree: "Associate of Computer Science",
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
      {job.start} — {job.end === null ? <span className="resume-now">present</span> : job.end}
    </>
  );

  return (
    <div
      className={`resume-entry ${index % 2 ? "tilt-r-sm" : "tilt-l-sm"} ${job.featured ? "resume-entry--featured" : ""}`}
    >
      <button
        type="button"
        className="resume-entry__head"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="resume-entry__title">
          <Highlight text={job.title} query={query} />
        </span>
        <span className="resume-entry__org">
          {job.companyUrl ? (
            <a
              href={job.companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              <Highlight text={job.company} query={query} />
            </a>
          ) : (
            <Highlight text={job.company} query={query} />
          )}
        </span>
        <span className="resume-entry__dates mono-meta">{dates}</span>
        <span className="resume-entry__toggle" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>
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

/* =============================================================
   Page
   ============================================================= */

function ResumePage() {
  const [mode, setMode] = useState("featured");
  const [activeTag, setActiveTag] = useState(null);
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState(() => new Set());
  const [allOpen, setAllOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [copied, setCopied] = useState(null);
  const searchRef = useRef(null);

  const q = query.trim().toLowerCase();

  const shown = useMemo(() => {
    if (printing) return allJobs;
    return allJobs.filter(job => {
      if (mode === "featured" && !activeTag && !job.featured) return false;
      if (activeTag && !job.tags.includes(activeTag)) return false;
      if (q && !jobText(job).includes(q)) return false;
      return true;
    });
  }, [mode, activeTag, q, printing]);

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
        <div className="resume-idcard__main">
          <div>
            <h1 className="resume-idcard__name">Reese Lundquist</h1>
            <div className="resume-idcard__role">
              Systems administrator · photographer · organizer · teacher
            </div>
            <div className="resume-idcard__where">
              San Antonio, TX · available locally or remote · open to freelance
            </div>
          </div>
          <div className="resume-idcard__rail mono-meta">
            <button type="button" onClick={() => copyToClipboard("howdy@rosematcha.com", "email")}>
              {copied === "email" ? "copied!" : "howdy@rosematcha.com"}
            </button>
            <a href="https://github.com/rosematcha" target="_blank" rel="noopener noreferrer">
              github.com/rosematcha
            </a>
            <button type="button" onClick={() => copyToClipboard("https://rosematcha.com", "site")}>
              {copied === "site" ? "copied!" : "rosematcha.com"}
            </button>
            <button type="button" className="resume-pdf" onClick={() => window.print()}>
              print / PDF
            </button>
          </div>
        </div>
      </div>

      <div className="resume-toolbar">
        <button
          type="button"
          className="resume-chip"
          aria-pressed={mode === "featured" && !activeTag}
          onClick={() => {
            setMode("featured");
            setActiveTag(null);
          }}
        >
          featured<span className="resume-chip__n">{allJobs.filter(j => j.featured).length}</span>
        </button>
        <button
          type="button"
          className="resume-chip resume-chip--all"
          aria-pressed={mode === "all" && !activeTag}
          onClick={() => {
            setMode("all");
            setActiveTag(null);
          }}
        >
          all<span className="resume-chip__n">{allJobs.length}</span>
        </button>
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

      <div className="resume-printhead">Experience</div>
      {shown.length === 0 ? (
        <div className="resume-empty scrap">
          Nothing matches that.{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveTag(null);
              setMode("all");
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

      <div className="resume-printhead">Education</div>
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
