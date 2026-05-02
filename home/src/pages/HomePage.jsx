import React from "react";
import { Link } from "react-router-dom";
import { Mail, Briefcase, Camera, Clapperboard, Sparkles } from "lucide-react";
import PolaroidStack from "../components/PolaroidStack";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="page-content">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-layout">
          <div className="hero-media">
            <PolaroidStack />
          </div>
          <div className="hero-copy">
            <h1 className="hero-title">Howdy, I'm Reese!</h1>
            <p className="hero-tagline">
              I'm a developer, photographer, editor, and avid taker of life's side quests. With my
              multidisciplinary background, I create cool tools and experiences for the people and
              causes I care about. Currently teaching pinhole photography{" "}
              <a
                href="https://www.utsa.edu/pace/community-art/youth.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                at UTSA Southwest
              </a>
              , helping computers serve students{" "}
              <a href="https://saysi.org/" target="_blank" rel="noopener noreferrer">
                at SAY Si
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
            <div className="hero-actions">
              <Link to="/projects" className="button">
                <Briefcase size={20} />
                View My Work
              </Link>
              <a href="mailto:howdy@rosematcha.com" className="button button--ghost">
                <Mail size={20} />
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        {/* Interests */}
        <div className="interests-section">
          <div className="interests-grid">
            <div className="interest-card">
              <span className="interest-stamp" aria-hidden="true">
                <Camera size={22} className="interest-icon" />
              </span>
              <h4>Photography</h4>
              <p>Specializing in event work and candid photography</p>
            </div>
            <div className="interest-card">
              <span className="interest-stamp" aria-hidden="true">
                <Sparkles size={22} className="interest-icon" />
              </span>
              <h4>Pokemon TCG</h4>
              <p>Running weekly tournaments for a local card league</p>
            </div>
            <div className="interest-card">
              <span className="interest-stamp" aria-hidden="true">
                <Clapperboard size={22} className="interest-icon" />
              </span>
              <h4>Film</h4>
              <p>
                <a
                  href="https://letterboxd.com/rosematcha/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
          <p className="tech-intro">
            Hosted on{" "}
            <a href="https://www.netlify.com/" target="_blank" rel="noopener noreferrer">
              Netlify
            </a>
            . The toolkit:
          </p>
          <ul className="tech-chips">
            <li>
              <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
                React
              </a>
            </li>
            <li>
              <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer">
                Vite
              </a>
            </li>
            <li>
              <a href="https://reactrouter.com/" target="_blank" rel="noopener noreferrer">
                React Router
              </a>
            </li>
            <li>
              <a href="https://www.11ty.dev/" target="_blank" rel="noopener noreferrer">
                Eleventy
              </a>
            </li>
            <li>
              <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer">
                TailwindCSS
              </a>
            </li>
            <li>
              <a href="https://wordpress.com/" target="_blank" rel="noopener noreferrer">
                WordPress
              </a>
            </li>
          </ul>
          <p className="tech-outro">
            Currently learning about JAM-compatible CMSes.
          </p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
