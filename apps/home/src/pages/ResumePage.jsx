// src/pages/ResumePage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./PageStyles.css";
import "./ResumePage.css";

function ResumePage() {
  const [expandedEntries, setExpandedEntries] = useState({});
  const [skillFilter, setSkillFilter] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['default']);

  // Toggle entry visibility
  const toggleEntry = (entryId) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  // Copy to clipboard functionality
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(`${type} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    });
  };

  // Job categories and data
  const jobCategories = {
    'default': 'Key Positions',
    'technology': 'Technology & Systems',
    'arts': 'Arts & Education', 
    'community': 'Community & Service',
    'all': 'All Positions'
  };

  const allJobs = [
    {
      id: "saySiAdmin",
      title: "Systems Administrator",
      company: "SAY Sí",
      companyUrl: "https://saysi.org/",
      dates: "January 2023 - Present",
      categories: ['technology'],
      tags: ["Systems Admin", "Infrastructure", "Automation"],
      details: [
        "Maintain and troubleshoot 100+ multi-platform devices (Windows, Mac, iOS).",
        "Implemented an inventory system for 500+ items and led data-driven infrastructure improvements.",
        "Develop automation scripts and maintain technical documentation and security protocols."
      ],
      featured: true
    },
    {
      id: "rubyCity",
      title: "Visitor Services Associate",
      company: "Ruby City",
      companyUrl: "https://rubycity.org/",
      dates: "May 2025 - Present",
      categories: ['community', 'arts'],
      tags: ["Customer Service", "Event Support", "Arts"],
      details: [
        "As a Visitor Services Associate, I am a primary point of contact for guests at Ruby City, a free contemporary art space in San Antonio.",
        "My role is to convey information on the Linda Pace Foundation's collection, our current exhibitions, Foundation policies, and the building's architecture.",
        "I proactively address guest needs and resolve issues to ensure all visits are smooth and positive.",
        "I also provide direct support for public programs and events, assisting with logistics and guest management."
      ],
      featured: true
    },
    {
      id: "stonewallAction",
      title: "Organizer",
      company: "Stonewall Action",
      companyUrl: "https://stonewallaction.org/",
      dates: "March 2025 - Present",
      categories: ['community', 'technology'],
      tags: ["Non-profit", "WordPress", "Event Planning"],
      details: [
        "Stonewall Action is a non-profit to protect and enshrine the rights of LGBTQ+ folks in Central Texas. On a contract basis, I was assigned to consult with them in partnership with Collective Campaigns.",
        "I kickstarted the nonprofit's operations and developed a support network of capable volunteers and community members to make it function independently.",
        "I organized several events for Stonewall Action, including our launch event and the \"Lights, Camera, Action!\" event.",
        "I designed graphics, filmed video, and edited visuals for promotion of Stonewall Action events and causes.",
        "I designed a website using WordPress for users, and developed bespoke extensions for specific use cases, such as a serialized check-in system for assigning roles to volunteers."
      ],
      featured: false
    },
    {
      id: "combatPower",
      title: "Event Organizer & Card Specialist",
      company: "Combat Power Collectibles",
      companyUrl: "https://www.instagram.com/combat_power_gaming/?hl=en",
      dates: "August 2024 - Present",
      categories: ['community'],
      tags: ["Events", "Gaming", "Inventory"],
      details: [
        "Manage and execute Pokémon card tournaments, overseeing logistics and participant engagement.",
        "Price, organize, and stock trading cards, ensuring inventory accuracy and customer assistance."
      ],
      featured: false
    },
    {
      id: "utsaSouthwest",
      title: "Instructor, Saturday Morning Discovery",
      company: "UTSA Southwest",
      companyUrl: null,
      dates: "May 2023 - Present",
      categories: ['arts'],
      tags: ["Education", "Photography", "Youth Programs"],
      details: [
        "I teach with UTSA's \"Saturday Morning Discovery\" program, a no-cost program for San Antonio youth to expose them to different artistic mediums.",
        "Through much of the year, I teach our \"Pinhole Photography\" course. I teach young artists from ages 7 to 18 (and their parents, if they're so courageous) how to use an analog pinhole camera, develop film in a darkroom, and create prints of their work.",
        "I developed a curriculum for a summer \"3-D Photography\" course, introducing young artists aged 7 to 12 to the fundamentals of photography and photo editing, as well as a technique to make their photos appear 3-D using anaglyph glasses."
      ],
      featured: true
    },
    {
      id: "bexarParty",
      title: "Office Aide & Voter Information Specialist",
      company: "Bexar County Democratic Party",
      companyUrl: "https://www.bexardemocrat.org/",
      dates: "April 2024 - January 2025",
      categories: ['community'],
      tags: ["Civic Engagement", "Data Management", "Customer Service"],
      details: [
        "Provided public assistance on voter information, conducted outreach, and managed voter roll documentation.",
        "Supported election procedures, developed civic engagement materials, and updated website for accessibility."
      ],
      featured: false
    },
    {
      id: "saySiArtist",
      title: "Media Arts Teaching Artist",
      company: "SAY Sí",
      companyUrl: "https://saysi.org/",
      dates: "August 2018 - February 2025",
      categories: ['arts'],
      tags: ["Teaching", "Adobe Suite", "Youth Programs"],
      details: [
        "Designed and led digital arts workshops (Adobe Suite, photography, video) for youth.",
        "Managed program operations, including student enrollment and documentation.",
        "Developed digital resources and organized student artwork showcases."
      ],
      featured: true
    },
    {
      id: "hopVine",
      title: "Operations Manager / Systems Coordinator",
      company: "Hop + Vine",
      companyUrl: null,
      dates: "October 2019 - February 2021",
      categories: ['technology', 'community'],
      tags: ["Operations", "QuickBooks", "POS Systems"],
      details: [
        "Managed payroll, financial records, and inventory using QuickBooks.",
        "Implemented digital solutions for workflow automation and POS systems, providing tech support."
      ],
      featured: false
    },
    {
      id: "mcDonalds",
      title: "Crew Member",
      company: "McDonald's",
      companyUrl: "https://txmcd.com/",
      dates: "April 2017 - August 2020",
      categories: ['community'],
      tags: ["Customer Service", "Training", "Team Leadership"],
      details: [
        "I bagged orders, made drinks and fries, served customers in the front and drive-thru, and maintained a clean front lobby.",
        "I prioritized a good customer experience, and received several manager-directed compliments about the quality of my service. Several customers drove to our location specifically from further out just to see me.",
        "I trained new staff on the company's policies and procedures, and answered staff questions.",
        "Even though this was my first job, I was the \"employee of the month\" four times in my time here!"
      ],
      featured: false
    },
    {
      id: "webDev",
      title: "Contract Web Development",
      company: "Freelance",
      companyUrl: null,
      dates: "January 2020 - Present",
      categories: ['technology'],
      tags: ["Web Development", "Accessibility", "Open Source"],
      details: [
        "Design and maintain accessible, user-friendly websites for clients, utilizing open technologies."
      ],
      featured: false
    },
    {
      id: "photography",
      title: "Freelance Photography",
      company: "Freelance",
      companyUrl: null,
      dates: "October 2019 - Present",
      categories: ['arts'],
      tags: ["Photography", "Event Coverage", "Digital Media"],
      details: [
        "Provide event photography and digital media creation for diverse clients and occasions."
      ],
      featured: false
    }
  ];

  // Toggle category selection (mutually exclusive)
  const toggleCategory = (category) => {
    setSelectedCategories([category]);
  };

  // Filter jobs based on selected category and search
  const filteredJobs = allJobs.filter(job => {
    let matchesCategory = false;
    
    if (selectedCategories.includes('default')) {
      matchesCategory = job.featured;
    } else if (selectedCategories.includes('all')) {
      matchesCategory = true;
    } else {
      matchesCategory = selectedCategories.some(cat => job.categories.includes(cat));
    }
    
    const matchesSearch = skillFilter === '' || 
      job.title.toLowerCase().includes(skillFilter.toLowerCase()) ||
      job.company.toLowerCase().includes(skillFilter.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(skillFilter.toLowerCase())) ||
      job.details.some(detail => detail.toLowerCase().includes(skillFilter.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Skills data with proficiency levels
  const skillsData = {
    'Technical': [
      { name: 'Systems Administration', level: 95 },
      { name: 'JavaScript/React', level: 85 },
      { name: 'HTML/CSS', level: 90 },
      { name: 'Network Support', level: 80 },
      { name: 'Security Protocols', level: 75 }
    ],
    'Creative & Media': [
      { name: 'Adobe Creative Suite', level: 90 },
      { name: 'Photography', level: 95 },
      { name: 'Video Production', level: 85 },
      { name: 'UX/UI Design', level: 80 },
      { name: 'Graphic Design', level: 85 }
    ],
    'Operations & Events': [
      { name: 'Event Planning', level: 90 },
      { name: 'Project Management', level: 85 },
      { name: 'Customer Service', level: 95 },
      { name: 'Team Leadership', level: 80 },
      { name: 'Community Engagement', level: 90 }
    ]
  };

  return (
    <div className="page-content">
      {/* Header with actions removed */}

      {/* Contact Info with Copy Actions */}
      <div className="resume-contact-card">
        <h3 className="resume-name">Reese Ferguson</h3>
        <div className="contact-actions">
          <button 
            className="button"
            onClick={() => copyToClipboard('hi@rosematcha.com', 'Email')}
            title="Copy email"
          >
            <svg className="icon-inline mr-2" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
            hi@rosematcha.com
          </button>
          <button 
            className="button"
            onClick={() => copyToClipboard('https://rosematcha.com', 'Website')}
            title="Copy website URL"
          >
            <svg className="icon-inline mr-2" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 2.1A8.02 8.02 0 0 0 6.2 7H11V4.1zM4.1 11A8.02 8.02 0 0 1 7 6.2V11H4.1zM11 19.9A8.02 8.02 0 0 1 6.2 17H11v2.9zM7 13v4.8A8.02 8.02 0 0 0 11 19v-6H7zm6 6a8.02 8.02 0 0 0 3.8-2.2H13V19zm4.9-6A8.02 8.02 0 0 1 17 17.8V13h2.9zM13 11V4.1A8.02 8.02 0 0 1 17.8 7H13z"/></svg>
            rosematcha.com
          </button>
          <a 
            className="button"
            href="https://github.com/rosematcha"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="icon-inline mr-2" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v2H4V4zm0 6h16v2H4v-2zm0 6h10v2H4v-2z"/></svg>
            GitHub
          </a>
        </div>
        {copyFeedback && <div className="copy-feedback">{copyFeedback}</div>}
      </div>

      {/* Filter */}
      <div className="resume-filter">
        <input
          type="text"
          placeholder="🔍 Filter by skills, technologies, or keywords..."
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="filter-input"
        />
        
        {filteredJobs.length !== allJobs.length && skillFilter && (
          <div className="filter-results">
            Showing {filteredJobs.length} of {allJobs.length} positions
          </div>
        )}
      </div>

      {/* --- SUMMARY --- */}
      <section className="resume-section">
        <h4>Summary</h4>
        <div className="summary-card">
          <p>
            Versatile professional with expertise in systems administration, arts
            education, event organization, and web development. Skilled in managing
            technical infrastructure, creating engaging content, coordinating
            community initiatives, and delivering excellent customer service.
            Passionate about user-centric design and open technologies.
          </p>
        </div>
      </section>

      {/* --- WORK EXPERIENCE --- */}
      <section className="resume-section">
        <h4>Work Experience</h4>
        
        {/* Category Filters */}
        <div className="category-filters">
          {Object.entries(jobCategories).map(([key, label]) => (
            <button
              key={key}
              className="button button--sm button--ghost"
              aria-pressed={selectedCategories.includes(key)}
              onClick={() => toggleCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div className={`experience-container`}>
          {filteredJobs.map((job) => (
            <div key={job.id} className={`job-entry`}>
              <div className="job-header">
                <h5 onClick={() => toggleEntry(job.id)}>
                  {job.title}
                  <span className="toggle-icon">
                    {expandedEntries[job.id] ? "[-]" : "[+]"
                    }
                  </span>
                </h5>
                <div className="job-meta">
                  <p>
                    {job.companyUrl ? (
                      <a href={job.companyUrl} target="_blank" rel="noopener noreferrer">
                        <strong>{job.company}</strong>
                      </a>
                    ) : (
                      <strong>{job.company}</strong>
                    )} | {job.dates}
                  </p>
                  <div className="job-tags">
                    {job.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              {expandedEntries[job.id] && (
                <ul className="job-details">
                  {job.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          
          {filteredJobs.length === 0 && (
            <div className="no-results">
              <p>No positions match your current filters.</p>
              <button 
                className="button"
                onClick={() => {
                  setSelectedCategories(['default']);
                  setSkillFilter('');
                }}
              >
                Reset to Key Positions
              </button>
            </div>
          )}
        </div>
      </section>

      {/* --- SKILLS VISUALIZATION --- */}
      <section className="resume-section hidden">
        <h4>Skills & Proficiency</h4>
        <div className="skills-visualization">
          {Object.entries(skillsData).map(([category, skills]) => (
            <div key={category} className="skill-category">
              <h5>{category}</h5>
              <div className="skill-bars">
                {skills.map((skill) => (
                  <div key={skill.name} className="skill-item">
                    <div className="skill-header">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-percentage">{skill.level}%</span>
                    </div>
                    <div className="skill-bar">
                      <div 
                        className="skill-fill"
                        style={{ 
                          width: `${skill.level}%`,
                          animationDelay: `${Math.random() * 0.5}s`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- EDUCATION --- */}
      <section className="resume-section">
        <h4>Education</h4>
        <div className="education-entry">
          <h5>Associate of Computer Science</h5>
          <p>
            Northwest Vista College | San Antonio, TX
            <br />
            <em>Graduated: May 2023</em>
          </p>
        </div>
      </section>

      {/* --- RECOMMENDATIONS --- */}
      <section className="resume-section hidden">
        <h4>Professional Highlights</h4>
        <div className="recommendations">
          <div className="recommendation-card">
            <div className="quote-mark">"</div>
            <p>
              Implemented an inventory system for 500+ items and led data-driven infrastructure improvements, 
              significantly enhancing organizational efficiency.
            </p>
            <div className="recommendation-source">Systems Administration Achievement</div>
          </div>
          <div className="recommendation-card">
            <div className="quote-mark">"</div>
            <p>
              Employee of the month four times during tenure at McDonald's, 
              with customers specifically requesting my service.
            </p>
            <div className="recommendation-source">Customer Service Excellence</div>
          </div>
          <div className="recommendation-card">
            <div className="quote-mark">"</div>
            <p>
              Developed bespoke WordPress extensions including a serialized check-in system 
              for volunteer role assignments.
            </p>
            <div className="recommendation-source">Web Development Innovation</div>
          </div>
        </div>
      </section>

      <div className="text-center mt-6">
        <Link to="/" className="button">
          <svg className="icon-inline mr-2" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19l-7-7 7-7v4h8v6h-8v4z"/></svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default ResumePage;