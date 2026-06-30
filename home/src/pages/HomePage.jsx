import React from "react";
import { Link } from "react-router-dom";
import { Mail, Briefcase } from "lucide-react";
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

    </div>
  );
}

export default HomePage;
