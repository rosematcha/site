// src/pages/ResumePage.jsx
import React, { useState } from "react"; // MODIFIED: Added useState
import { Link } from "react-router-dom";
import "./PageStyles.css";
import "./ResumePage.css";

function ResumePage() {
  const [expandedEntries, setExpandedEntries] = useState({}); // ADDED: State for expanded entries

  // ADDED: Function to toggle entry visibility
  const toggleEntry = (entryId) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  return (
    <div className="page-content">
      <div className="resume-header" style={{ marginBottom: "20px" }}>
        {" "}
        {/* MODIFIED: Added className, kept marginBottom for now, can be moved to CSS */}
        <h2>Digital Resume</h2>
      </div>


      <h3 className="resume-name">Reese Ferguson</h3> {/* MODIFIED: Added className */}


      {/* --- SUMMARY --- */}
      <h4>Summary</h4>
      <p>
        Versatile professional with expertise in systems administration, arts
        education, event organization, and web development. Skilled in managing
        technical infrastructure, creating engaging content, coordinating
        community initiatives, and delivering excellent customer service.
        Passionate about user-centric design and open technologies.
      </p>
      <hr className="resume-divider" />

      {/* --- WORK EXPERIENCE --- */}
      <h4>Work Experience</h4>
      
      <div className="job-entry">
        <h5 onClick={() => toggleEntry("saySiAdmin")}>
          Systems Administrator
          <span className="toggle-icon">
            {expandedEntries["saySiAdmin"] ? "[-]" : "[+]"}{" "}
          </span>
        </h5>
        <p>
          <a href="https://saysi.org/" target="_blank" rel="noopener noreferrer"><strong>SAY Sí</strong></a> | January 2023 - Present
        </p>
        {expandedEntries["saySiAdmin"] && (
          <ul className="job-details">
            <li>
              Maintain and troubleshoot 100+ multi-platform devices (Windows,
              Mac, iOS).
            </li>
            <li>
              Implemented an inventory system for 500+ items and led data-driven
              infrastructure improvements.
            </li>
            <li>
              Develop automation scripts and maintain technical documentation and
              security protocols.
            </li>
          </ul>
        )}
      </div>

      <div className="job-entry">
        <h5 onClick={() => toggleEntry("rubyCity")}>
          Visitor Services Associate
          <span className="toggle-icon">
            {expandedEntries["rubyCity"] ? "[-]" : "[+]"}{" "}
          </span>
        </h5>
        <p>
          <a href="https://rubycity.org/" target="_blank" rel="noopener noreferrer"><strong>Ruby City</strong></a> | May 2025 - Present
        </p>
        {expandedEntries["rubyCity"] && (
          <ul className="job-details">
            <li>
              As a Visitor Services Associate, I am a primary point of contact for guests at Ruby City, a free contemporary art space in San Antonio.
            </li>
            <li>
              My role is to convey information on the Linda Pace Foundation's collection, our current exhibitions, Foundation policies, and the building's architecture.
            </li>
            <li>
              I proactively address guest needs and resolve issues to ensure all visits are smooth and positive.
            </li>
            <li>
              I also provide direct support for public programs and events, assisting with logistics and guest management.
            </li>
          </ul>
        )}
      </div>

      <div className="job-entry">
        <h5 onClick={() => toggleEntry("stonewallAction")}>
          Organizer
          <span className="toggle-icon">
            {expandedEntries["stonewallAction"] ? "[-]" : "[+]"}{" "}
          </span>
        </h5>
        <p>
          <a href="https://stonewallaction.org/" target="_blank" rel="noopener noreferrer"><strong>Stonewall Action</strong></a> | March 2025 - Present
        </p>
        {expandedEntries["stonewallAction"] && (
          <ul className="job-details">
            <li>
              Stonewall Action is a non-profit to protect and enshrine the rights of LGBTQ+ folks in Central Texas. On a contract basis, I was assigned to consult with them in partnership with Collective Campaigns.
            </li>
            <li>
              I kickstarted the nonprofit's operations and developed a support network of capable volunteers and community members to make it function independently.
            </li>
            <li>
              I organized several events for Stonewall Action, including our launch event and the "Lights, Camera, Action!" event.
            </li>
            <li>
              I designed graphics, filmed video, and edited visuals for promotion of Stonewall Action events and causes.
            </li>
            <li>
              I designed a website using WordPress for users, and developed bespoke extensions for specific use cases, such as a serialized check-in system for assigning roles to volunteers.
            </li>
          </ul>
        )}
      </div>

      <div className="job-entry">
        <h5 onClick={() => toggleEntry("combatPower")}>
          Event Organizer & Card Specialist
          <span className="toggle-icon">
            {expandedEntries["combatPower"] ? "[-]" : "[+]"}{" "}
          </span>
        </h5>
        <p>
          <a href="https://www.instagram.com/combat_power_gaming/?hl=en" target="_blank" rel="noopener noreferrer"><strong>Combat Power Collectibles</strong></a> | August 2024 - Present
        </p>
        {expandedEntries["combatPower"] && (
          <ul className="job-details">
            <li>
              Manage and execute Pokémon card tournaments, overseeing logistics and
              participant engagement.
            </li>
            <li>
              Price, organize, and stock trading cards, ensuring inventory
              accuracy and customer assistance.
            </li>
          </ul>
        )}
      </div>

      <div className="job-entry">
        <h5 onClick={() => toggleEntry("utsaSouthwest")}>
          Instructor, Saturday Morning Discovery
          <span className="toggle-icon">
            {expandedEntries["utsaSouthwest"] ? "[-]" : "[+]"}{" "}
          </span>
        </h5>
        <p>
          <strong>UTSA Southwest</strong> | May 2023 - Present
        </p>
        {expandedEntries["utsaSouthwest"] && (
          <ul className="job-details">
            <li>
              I teach with UTSA's "Saturday Morning Discovery" program, a no-cost program for San Antonio youth to expose them to different artistic mediums.
            </li>
            <li>
              Through much of the year, I teach our "Pinhole Photography" course. I teach young artists from ages 7 to 18 (and their parents, if they're so courageous) how to use an analog pinhole camera, develop film in a darkroom, and create prints of their work.
            </li>
            <li>
              I developed a curriculum for a summer "3-D Photography" course, introducing young artists aged 7 to 12 to the fundamentals of photography and photo editing, as well as a technique to make their photos appear 3-D using anaglyph glasses.
          </ul>
        )}
      </div>

      <div className="job-entry">
        <h5 onClick={() => toggleEntry("bexarParty")}>
          Office Aide & Voter Information Specialist
          <span className="toggle-icon">
            {expandedEntries["bexarParty"] ? "[-]" : "[+]"}{" "}
          </span>
        </h5>
        <p>
          <a href="https://www.bexardemocrat.org/" target="_blank" rel="noopener noreferrer"><strong>Bexar County Democratic Party</strong></a> | April 2024 - January 2025
        </p>
        {expandedEntries["bexarParty"] && (
          <ul className="job-details">
            <li>
              Provided public assistance on voter information, conducted outreach,
              and managed voter roll documentation.
            </li>
            <li>
              Supported election procedures, developed civic engagement materials,
              and updated website for accessibility.
            </li>
          </ul>
        )}
      </div>

      <div className="job-entry">
        <h5 onClick={() => toggleEntry("saySiArtist")}>
          Media Arts Teaching Artist
          <span className="toggle-icon">
            {expandedEntries["saySiArtist"] ? "[-]" : "[+]"}{" "}
          </span>
        </h5>
        <p>
          <a href="https://saysi.org/" target="_blank" rel="noopener noreferrer"><strong>SAY Sí</strong></a> | August 2018 - February 2025
        </p>
        {expandedEntries["saySiArtist"] && (
          <ul className="job-details">
            <li>
              Designed and led digital arts workshops (Adobe Suite, photography,
              video) for youth.
            </li>
            <li>
              Managed program operations, including student enrollment and
              documentation.
            </li>
            <li>
              Developed digital resources and organized student artwork showcases.
            </li>
          </ul>
        )}
      </div>

      <div className="job-entry">
        <h5 onClick={() => toggleEntry("hopVine")}>
          Operations Manager / Systems Coordinator
          <span className="toggle-icon">
            {expandedEntries["hopVine"] ? "[-]" : "[+]"}{" "}
          </span>
        </h5>
        <p>
          <strong>Hop + Vine</strong> | October 2019 - February 2021
        </p>
        {expandedEntries["hopVine"] && (
          <ul className="job-details">
            <li>
              Managed payroll, financial records, and inventory using QuickBooks.
            </li>
            <li>
              Implemented digital solutions for workflow automation and POS
              systems, providing tech support.
            </li>
          </ul>
        )}
      </div>

      <div className="job-entry">
        <h5 onClick={() => toggleEntry("mcDonalds")}>
          Crew Member
          <span className="toggle-icon">
            {expandedEntries["mcDonalds"] ? "[-]" : "[+]"}{" "}
          </span>
        </h5>
        <p>
          <a href="https://txmcd.com/" target="_blank" rel="noopener noreferrer"><strong>McDonald's</strong></a> | April 2017 - August 2020
        </p>
        {expandedEntries["mcDonalds"] && (
          <ul className="job-details">
            <li>
              I bagged orders, made drinks and fries, served customers in the front and drive-thru, and maintained a clean front lobby.
            </li>
            <li>
              I prioritized a good customer experience, and recieved several manager-directed compliments about the quality of my service. Several customers drove to our location specifically from further out just to see me.
            </li>
            <li>
              I trained new staff on the company's policies and procedures, and answered staff questions.
            </li>
            <li>
              Even though this was my first job, I was the "employee of the month" four times in my time here!
            </li>
          </ul>
        )}
      </div>
      <hr className="resume-divider" />

      {/* --- EDUCATION --- */}
      <h4>Education</h4>
      <div className="education-entry">
        <h5>Associate of Computer Science</h5>
        <p>
          Northwest Vista College | San Antonio, TX
          <br />
          <em>Graduated: May 2023</em>
        </p>
      </div>
      <hr className="resume-divider" />

      {/* --- ADDITIONAL EXPERIENCE (NOW FOR FREELANCE) --- */}
      <h4>Additional Experience</h4>
      {/* If you want to keep Contract Web Development and Freelance Photography separate */}
      <div className="additional-entry">
        <h5>Contract Web Development</h5>
        <p>Freelance | January 2020 - Present</p>
        <p>
          Design and maintain accessible, user-friendly websites for clients,
          utilizing open technologies.
        </p>
      </div>

      <div className="additional-entry">
        <h5>Freelance Photography</h5>
        <p>Freelance | October 2019 - Present</p>
        <p>
          Provide event photography and digital media creation for diverse
          clients and occasions.
        </p>
      </div>

            {/* --- SKILLS --- */}
      <h4>Skills</h4>
      <ul className="skills-list">
        <li>
          <strong>Technical:</strong> Systems Admin (Windows, MacOS, Linux, iOS),
          Asset Tracking, IT Documentation, Troubleshooting, Network Support,
          Security Protocols, HTML, CSS, JavaScript, ReactJS.
        </li>
        <li>
          <strong>Creative & Media:</strong> Adobe Creative Suite, Photography
          (Digital & Pinhole), Video Production, Graphic Design, UX/UI,
          Accessibility Standards.
        </li>
        <li>
          <strong>Operations & Events:</strong> Event Planning & Management,
          Workflow Automation, POS Systems, Data Management, Community
          Engagement, Social Media, Customer Service, Cash Handling.
        </li>
        <li>
          <strong>General:</strong> Communication, Organization, Problem-Solving,
          Team Collaboration, Project Coordination, Curriculum Development.
        </li>
      </ul>
      <hr className="resume-divider" />

      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <Link to="/" className="geocities-button">
          <img
            src="/img/back_button.gif"
            alt="Back to Home"
            style={{ verticalAlign: "middle", marginRight: "5px" }}
          />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default ResumePage;