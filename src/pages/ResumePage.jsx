// src/pages/ResumePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./PageStyles.css";

function ResumePage() {
  return (
    <div className="page-content">
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2>Digital Resume</h2>
      </div>

      <h3>Reese Ferguson</h3>
      <p style={{ textAlign: "center", marginBottom: "20px" }}>
        <a href="mailto:me@rosematcha.com">me@rosematcha.com</a> |{" "}
        <a
          href="https://linkedin.com/in/yourprofile" // Replace with your actual LinkedIn
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn Profile
        </a>
      </p>

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

      {/* --- WORK EXPERIENCE --- */}
      <h4>Work Experience</h4>

      <div className="job-entry">
        <h5>Visitor Services Associate</h5>
        <p>
          <strong>Ruby City</strong> | San Antonio, TX | May 2025 - Present
        </p>
        <ul>
          <li>
            Deliver exceptional guest experiences by conveying knowledge of
            Foundation policies, collections, and architecture.
          </li>
          <li>
            Proactively address guest needs, resolve issues, and support public
            programs and events.
          </li>
        </ul>
      </div>

      <div className="job-entry">
        <h5>Organizer</h5>
        <p>
          <strong>Stonewall Action</strong> | San Antonio, TX | March 2025 -
          Present
        </p>
        <ul>
          <li>
            Organize community events and create social media content to promote
            advocacy.
          </li>
          <li>Refine activist language for impactful communication.</li>
        </ul>
      </div>

      <div className="job-entry">
        <h5>Event Organizer & Card Specialist</h5>
        <p>
          <strong>Combat Power Collectibles</strong> | San Antonio, TX | August
          2024 - Present
        </p>
        <ul>
          <li>
            Manage and execute Pokémon card tournaments, overseeing logistics and
            participant engagement.
          </li>
          <li>
            Price, organize, and stock trading cards, ensuring inventory
            accuracy and customer assistance.
          </li>
        </ul>
      </div>

      <div className="job-entry">
        <h5>Instructor, Saturday Morning Discovery</h5>
        <p>
          <strong>UTSA Southwest</strong> | San Antonio, TX | May 2023 - Present
        </p>
        <ul>
          <li>
            Teach pinhole photography to youth in a free art exploration
            program, guiding hands-on learning.
          </li>
        </ul>
      </div>

      <div className="job-entry">
        <h5>Systems Administrator</h5>
        <p>
          <strong>SAY Sí</strong> | San Antonio, TX | January 2023 - Present
        </p>
        <ul>
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
      </div>

      <div className="job-entry">
        <h5>Office Aide & Voter Information Specialist</h5>
        <p>
          <strong>Bexar County Democratic Party</strong> | San Antonio, TX |
          April 2024 - January 2025
        </p>
        <ul>
          <li>
            Provided public assistance on voter information, conducted outreach,
            and managed voter roll documentation.
          </li>
          <li>
            Supported election procedures, developed civic engagement materials,
            and updated website for accessibility.
          </li>
        </ul>
      </div>

      <div className="job-entry">
        <h5>Media Arts Teaching Artist</h5>
        <p>
          <strong>SAY Sí</strong> | San Antonio, TX | August 2018 - February
          2025
        </p>
        <ul>
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
      </div>

      <div className="job-entry">
        <h5>Operations Manager / Systems Coordinator</h5> {/* Shortened title */}
        <p>
          <strong>Hop + Vine</strong> | San Antonio, TX | October 2019 -
          February 2021
        </p>
        <ul>
          <li>
            Managed payroll, financial records, and inventory using QuickBooks.
          </li>
          <li>
            Implemented digital solutions for workflow automation and POS
            systems, providing tech support.
          </li>
        </ul>
      </div>

      <div className="job-entry">
        <h5>Crew Member</h5>
        <p>
          <strong>McDonald's</strong> | San Antonio, TX | April 2017 - August
          2020
        </p>
        <ul>
          <li>
            Provided customer service and operated POS systems in a fast-paced
            environment.
          </li>
          <li>
            Handled cash transactions accurately and maintained service area
            cleanliness.
          </li>
        </ul>
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
