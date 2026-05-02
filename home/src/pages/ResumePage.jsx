// src/pages/ResumePage.jsx
// Compact dense panel layout. Each section sits in a warm-tertiary block
// with tight padding and inline section counts. Engineering-dossier feel.
import React, { useState } from "react";
import {
  ChevronRight,
  Github,
  Globe,
  Mail,
  Printer,
} from "lucide-react";
import "./ResumePage.css";

/* =============================================================
   Data
   ============================================================= */

const summary =
  "Versatile generalist working across systems administration, arts education, event organizing, and web development. Equally comfortable maintaining infrastructure for a hundred devices and teaching seven-year-olds how to develop film in a darkroom. Driven by user-centric design, open technologies, and the people I get to do the work with.";

const jobCategories = {
  all: "All",
  default: "Featured",
  technology: "Technology",
  arts: "Arts & Education",
  community: "Community",
};

const allJobs = [
  {
    id: "saySiAdmin",
    title: "Systems Administrator",
    company: "SAY Sí",
    companyUrl: "https://saysi.org/",
    dates: "January 2023 — Present",
    year: "2023",
    categories: ["technology"],
    tags: ["Systems Admin", "Infrastructure", "Automation"],
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
    dates: "May 2025 — Present",
    year: "2025",
    categories: ["community", "arts"],
    tags: ["Customer Service", "Event Support", "Arts"],
    details: [
      "As a Visitor Services Associate, I am a primary point of contact for guests at Ruby City, a free contemporary art space in San Antonio.",
      "My role is to convey information on the Linda Pace Foundation's collection, our current exhibitions, Foundation policies, and the building's architecture.",
      "I proactively address guest needs and resolve issues to ensure all visits are smooth and positive.",
      "I also provide direct support for public programs and events, assisting with logistics and guest management.",
    ],
    featured: true,
  },
  {
    id: "stonewallAction",
    title: "Organizer",
    company: "Stonewall Action",
    companyUrl: "https://stonewallaction.org/",
    dates: "March 2025 — Present",
    year: "2025",
    categories: ["community", "technology"],
    tags: ["Non-profit", "WordPress", "Event Planning"],
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
    dates: "August 2024 — Present",
    year: "2024",
    categories: ["community"],
    tags: ["Events", "Gaming", "Inventory"],
    details: [
      "Manage and execute Pokémon card tournaments, overseeing logistics and participant engagement.",
      "Price, organize, and stock trading cards, ensuring inventory accuracy and customer assistance.",
    ],
    featured: false,
  },
  {
    id: "utsaSouthwest",
    title: "Instructor, Saturday Morning Discovery",
    company: "UTSA Southwest",
    companyUrl: null,
    dates: "May 2023 — Present",
    year: "2023",
    categories: ["arts"],
    tags: ["Education", "Photography", "Youth Programs"],
    details: [
      'I teach with UTSA\'s "Saturday Morning Discovery" program, a no-cost program for San Antonio youth to expose them to different artistic mediums.',
      'Through much of the year, I teach our "Pinhole Photography" course. I teach young artists from ages 7 to 18 (and their parents, if they\'re so courageous) how to use an analog pinhole camera, develop film in a darkroom, and create prints of their work.',
      'I developed a curriculum for a summer "3-D Photography" course, introducing young artists aged 7 to 12 to the fundamentals of photography and photo editing, as well as a technique to make their photos appear 3-D using anaglyph glasses.',
    ],
    featured: true,
  },
  {
    id: "bexarParty",
    title: "Office Aide & Voter Information Specialist",
    company: "Bexar County Democratic Party",
    companyUrl: "https://www.bexardemocrat.org/",
    dates: "April 2024 — January 2025",
    year: "2024",
    categories: ["community"],
    tags: ["Civic Engagement", "Data Management", "Customer Service"],
    details: [
      "Provided public assistance on voter information, conducted outreach, and managed voter roll documentation.",
      "Supported election procedures, developed civic engagement materials, and updated website for accessibility.",
    ],
    featured: false,
  },
  {
    id: "saySiArtist",
    title: "Media Arts Teaching Artist",
    company: "SAY Sí",
    companyUrl: "https://saysi.org/",
    dates: "August 2018 — February 2025",
    year: "2018",
    categories: ["arts"],
    tags: ["Teaching", "Adobe Suite", "Youth Programs"],
    details: [
      "Designed and led digital arts workshops (Adobe Suite, photography, video) for youth.",
      "Managed program operations, including student enrollment and documentation.",
      "Developed digital resources and organized student artwork showcases.",
    ],
    featured: true,
  },
  {
    id: "hopVine",
    title: "Operations Manager / Systems Coordinator",
    company: "Hop + Vine",
    companyUrl: null,
    dates: "October 2019 — February 2021",
    year: "2019",
    categories: ["technology", "community"],
    tags: ["Operations", "QuickBooks", "POS Systems"],
    details: [
      "Managed payroll, financial records, and inventory using QuickBooks.",
      "Implemented digital solutions for workflow automation and POS systems, providing tech support.",
    ],
    featured: false,
  },
  {
    id: "mcDonalds",
    title: "Crew Member",
    company: "McDonald's",
    companyUrl: "https://txmcd.com/",
    dates: "April 2017 — August 2020",
    year: "2017",
    categories: ["community"],
    tags: ["Customer Service", "Training", "Team Leadership"],
    details: [
      "I bagged orders, made drinks and fries, served customers in the front and drive-thru, and maintained a clean front lobby.",
      "I prioritized a good customer experience, and received several manager-directed compliments about the quality of my service. Several customers drove to our location specifically from further out just to see me.",
      "I trained new staff on the company's policies and procedures, and answered staff questions.",
      'Even though this was my first job, I was the "employee of the month" four times in my time here!',
    ],
    featured: false,
  },
  {
    id: "webDev",
    title: "Contract Web Development",
    company: "Freelance",
    companyUrl: null,
    dates: "January 2020 — Present",
    year: "2020",
    categories: ["technology"],
    tags: ["Web Development", "Accessibility", "Open Source"],
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
    dates: "October 2019 — Present",
    year: "2019",
    categories: ["arts"],
    tags: ["Photography", "Event Coverage", "Digital Media"],
    details: [
      "Provide event photography and digital media creation for diverse clients and occasions.",
    ],
    featured: false,
  },
];

const educationData = {
  degree: "Associate of Computer Science",
  school: "Northwest Vista College, San Antonio TX",
  year: "2023",
};

/* =============================================================
   Atoms
   ============================================================= */

function ContactLinks({ copyToClipboard }) {
  return (
    <div className="resume-contact">
      <button
        type="button"
        className="resume-contact__link"
        onClick={() => copyToClipboard("hi@rosematcha.com", "Email")}
        title="Copy email"
      >
        <Mail size={14} aria-hidden="true" />
        <span>hi@rosematcha.com</span>
      </button>
      <a
        className="resume-contact__link"
        href="https://github.com/rosematcha"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Github size={14} aria-hidden="true" />
        <span>github.com/rosematcha</span>
      </a>
      <button
        type="button"
        className="resume-contact__link"
        onClick={() => copyToClipboard("https://rosematcha.com", "Website")}
        title="Copy website URL"
      >
        <Globe size={14} aria-hidden="true" />
        <span>rosematcha.com</span>
      </button>
    </div>
  );
}

function PrintPill() {
  return (
    <button
      type="button"
      className="resume-pill resume-pill--ghost"
      onClick={() => window.print()}
      title="Print or save as PDF"
    >
      <Printer size={14} aria-hidden="true" />
      <span>Print / PDF</span>
    </button>
  );
}

function FilterControls({ skillFilter, setSkillFilter, selectedCategories, toggleCategory, total, shown }) {
  return (
    <div className="resume-controls">
      <input
        type="text"
        placeholder="Filter by skill, tool, or keyword…"
        value={skillFilter}
        onChange={e => setSkillFilter(e.target.value)}
        className="resume-filter-input"
        aria-label="Filter positions"
      />
      <div className="resume-chips" role="tablist" aria-label="Position categories">
        {Object.entries(jobCategories).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`resume-chip${selectedCategories.includes(key) ? " is-active" : ""}`}
            aria-pressed={selectedCategories.includes(key)}
            onClick={() => toggleCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {shown !== total && skillFilter && (
        <div className="resume-controls__count">Showing {shown} of {total} positions</div>
      )}
    </div>
  );
}

function NoResults({ onReset }) {
  return (
    <li className="resume-no-results">
      <p>No positions match your current filters.</p>
      <button type="button" className="resume-pill" onClick={onReset}>
        Reset filters
      </button>
    </li>
  );
}

function JobTags({ tags }) {
  return (
    <ul className="resume-tags">
      {tags.map(tag => (
        <li key={tag} className="resume-tag">{tag}</li>
      ))}
    </ul>
  );
}

function JobCompany({ job }) {
  if (job.companyUrl) {
    return (
      <a
        href={job.companyUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="resume-job__company"
      >
        {job.company}
      </a>
    );
  }
  return <span className="resume-job__company">{job.company}</span>;
}

function JobEntry({ job, isOpen, onToggle }) {
  return (
    <li className={`resume-job${isOpen ? " is-open" : ""}`}>
      <button
        type="button"
        className="resume-job__head"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="resume-job__top">
          <h3 className="resume-job__title">{job.title}</h3>
          <ChevronRight size={16} className="resume-job__chevron" aria-hidden="true" />
        </div>
        <div className="resume-job__meta">
          <JobCompany job={job} />
          <span className="resume-job__dates">{job.dates}</span>
        </div>
        <JobTags tags={job.tags} />
      </button>
      {isOpen && (
        <ul className="resume-job__details">
          {job.details.map((d, i) => (<li key={i}>{d}</li>))}
        </ul>
      )}
    </li>
  );
}

/* =============================================================
   Page
   ============================================================= */

function ResumePage() {
  const [expandedEntries, setExpandedEntries] = useState({});
  const [skillFilter, setSkillFilter] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["default"]);

  const toggleEntry = entryId => {
    setExpandedEntries(prev => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(`${type} copied`);
      setTimeout(() => setCopyFeedback(""), 2000);
    });
  };

  const toggleCategory = category => {
    setSelectedCategories([category]);
  };

  const onReset = () => {
    setSelectedCategories(["default"]);
    setSkillFilter("");
  };

  const filteredJobs = allJobs.filter(job => {
    let matchesCategory = false;
    if (selectedCategories.includes("default")) {
      matchesCategory = job.featured;
    } else if (selectedCategories.includes("all")) {
      matchesCategory = true;
    } else {
      matchesCategory = selectedCategories.some(cat => job.categories.includes(cat));
    }

    const matchesSearch =
      skillFilter === "" ||
      job.title.toLowerCase().includes(skillFilter.toLowerCase()) ||
      job.company.toLowerCase().includes(skillFilter.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(skillFilter.toLowerCase())) ||
      job.details.some(detail => detail.toLowerCase().includes(skillFilter.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page-content resume-page">
      <section className="resume-panel resume-head">
        <div className="resume-head__id">
          <h1 className="resume-name">Reese Lundquist</h1>
          <p className="resume-tagline">
            Systems administrator, photographer, organizer, teacher · San Antonio, TX
          </p>
        </div>
        <div className="resume-head__actions">
          <ContactLinks copyToClipboard={copyToClipboard} />
          <PrintPill />
        </div>
      </section>

      <section className="resume-panel">
        <p className="resume-summary">{summary}</p>
      </section>

      <section className="resume-panel">
        <div className="resume-section-row">
          <h2 className="resume-section-title">Work</h2>
          <span className="resume-count">
            {filteredJobs.length === allJobs.length
              ? `${allJobs.length} positions`
              : `${filteredJobs.length} of ${allJobs.length}`}
          </span>
        </div>
        <FilterControls
          skillFilter={skillFilter}
          setSkillFilter={setSkillFilter}
          selectedCategories={selectedCategories}
          toggleCategory={toggleCategory}
          total={allJobs.length}
          shown={filteredJobs.length}
        />
        <ol className="resume-list">
          {filteredJobs.map(job => (
            <JobEntry
              key={job.id}
              job={job}
              isOpen={!!expandedEntries[job.id]}
              onToggle={() => toggleEntry(job.id)}
            />
          ))}
          {filteredJobs.length === 0 && <NoResults onReset={onReset} />}
        </ol>
      </section>

      <section className="resume-panel">
        <div className="resume-section-row">
          <h2 className="resume-section-title">Education</h2>
          <span className="resume-count">1 entry</span>
        </div>
        <div className="resume-edu">
          <h3 className="resume-edu__degree">{educationData.degree}</h3>
          <span className="resume-edu__school">{educationData.school}</span>
          <span className="resume-edu__year">{educationData.year}</span>
        </div>
      </section>

      <div
        className={`copy-feedback ${copyFeedback ? "is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {copyFeedback}
      </div>
    </div>
  );
}

export default ResumePage;
