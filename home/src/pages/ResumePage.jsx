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
      "Maintain and troubleshoot 100+ multi-platform devices (Windows, Mac, iOS).",
      "Implemented an inventory system for 500+ items and led data-driven infrastructure improvements.",
      "Develop automation scripts and maintain technical documentation and security protocols.",
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
      "As a Visitor Services Associate, I am a primary point of contact for guests at Ruby City, a free contemporary art space in San Antonio.",
      "My role is to convey information on the Linda Pace Foundation's collection, our current exhibitions, Foundation policies, and the building's architecture.",
      "I proactively address guest needs and resolve issues to ensure all visits are smooth and positive.",
      "I also provide direct support for public programs and events, assisting with logistics and guest management.",
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
      'I teach with UTSA\'s "Saturday Morning Discovery" program, a no-cost program for San Antonio youth to expose them to different artistic mediums.',
      'Through much of the year, I teach our "Pinhole Photography" course. I teach young artists from ages 7 to 18 (and their parents, if they\'re so courageous) how to use an analog pinhole camera, develop film in a darkroom, and create prints of their work.',
      'I developed a curriculum for a summer "3-D Photography" course, introducing young artists aged 7 to 12 to the fundamentals of photography and photo editing, as well as a technique to make their photos appear 3-D using anaglyph glasses.',
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
      "Designed and led digital arts workshops (Adobe Suite, photography, video) for youth.",
      "Managed program operations, including student enrollment and documentation.",
      "Developed digital resources and organized student artwork showcases.",
    ],
    featured: true,
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
      "Stonewall Action is a non-profit to protect and enshrine the rights of LGBTQ+ folks in Central Texas. On a contract basis, I was assigned to consult with them in partnership with Collective Campaigns.",
      "I kickstarted the nonprofit's operations and developed a support network of capable volunteers and community members to make it function independently.",
      'I organized several events for Stonewall Action, including our launch event and the "Lights, Camera, Action!" event.',
      "I designed graphics, filmed video, and edited visuals for promotion of Stonewall Action events and causes.",
      "I designed a website using WordPress for users, and developed bespoke extensions for specific use cases, such as a serialized check-in system for assigning roles to volunteers.",
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
      "Manage and execute Pokémon card tournaments, overseeing logistics and participant engagement.",
      "Price, organize, and stock trading cards, ensuring inventory accuracy and customer assistance.",
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
      "Provided public assistance on voter information, conducted outreach, and managed voter roll documentation.",
      "Supported election procedures, developed civic engagement materials, and updated website for accessibility.",
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
      "Managed payroll, financial records, and inventory using QuickBooks.",
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
      "I bagged orders, made drinks and fries, served customers in the front and drive-thru, and maintained a clean front lobby.",
      "I prioritized a good customer experience, and received several manager-directed compliments about the quality of my service. Several customers drove to our location specifically from further out just to see me.",
      "I trained new staff on the company's policies and procedures, and answered staff questions.",
      'Even though this was my first job, I was the "employee of the month" four times in my time here!',
    ],
    featured: false,
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
      <button type="button" className="resume-entry__head" aria-expanded={isOpen} onClick={onToggle}>
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
