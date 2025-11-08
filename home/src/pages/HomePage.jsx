import React from "react";
import { Link } from "react-router-dom";
import { Mail, Briefcase, Camera, Clapperboard, Sparkles } from "lucide-react";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="page-content">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">Howdy, I'm Reese!</h1>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="about-content">
          <p style={{ textAlign: 'center' }}>
            I'm a developer, photographer, editor, and avid taker of life's side quests. With my multidisciplinary background, I create cool tools and experiences for the people and causes I care about. Currently teaching pinhole photography{" "}
            <a href="https://www.utsa.edu/pace/community-art/youth.html" target="_blank" rel="noopener noreferrer">
              at UTSA Southwest
            </a>
            , helping computers serve students{" "}
            <a href="https://saysi.org/" target="_blank" rel="noopener noreferrer">
              at SAY Sí
            </a>
            , maintaining{" "}
            <a href="https://ciphermaniac.com" target="_blank" rel="noopener noreferrer">
              Ciphermaniac
            </a>
            , and creating civic tech to service{" "}
            <a href="https://rosematcha.com/bexarvoting" target="_blank" rel="noopener noreferrer">
              the voters of Bexar County
            </a>
            .
          </p>
        </div>

        <div className="hero-actions">
          <a href="mailto:hi@rosematcha.com" className="button">
            <Mail size={20} />
            Get in Touch
          </a>
          <Link to="/projects" className="button button--ghost">
            <Briefcase size={20} />
            View My Work
          </Link>
        </div>

        {/* Interests */}
        <div className="interests-section">
          <h3>Beyond Work</h3>
          <div className="interests-grid">
            <div className="interest-card">
              <Camera size={32} className="interest-icon" />
              <h4>Photography</h4>
              <p>Specializing in event work and candid photography</p>
            </div>
            <div className="interest-card">
              <Sparkles size={32} className="interest-icon" />
              <h4>Pokémon TCG</h4>
              <p>Running weekly tournaments for a local card league</p>
            </div>
            <div className="interest-card">
              <Clapperboard size={32} className="interest-icon" />
              <h4>Film</h4>
                <p>
                  <a href="https://letterboxd.com/rosematcha/" target="_blank" rel="noopener noreferrer">
                    Watching lots of movies
                  </a>{" "}
                  with a deep passion for the movie theater
                </p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="tech-section">
          <h3>Built With</h3>
          <p className="tech-description">
            This site is hosted on{" "}
            <a href="https://www.netlify.com/" target="_blank" rel="noopener noreferrer">
              Netlify
            </a>{" "}
            and built with{" "}
            <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
              ReactJS
            </a>
            . Many of the other sub-projects use{" "}
            <a href="https://www.11ty.dev/" target="_blank" rel="noopener noreferrer">
              Eleventy
            </a>
            {" "}and{" "}
            <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer">
              TailwindCSS
            </a>
            . I'm also experienced in{" "}
            <a href="https://wordpress.com/" target="_blank" rel="noopener noreferrer">
              WordPress
            </a>
            , and am currently learning about JAM-compatible CMSes.
          </p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
