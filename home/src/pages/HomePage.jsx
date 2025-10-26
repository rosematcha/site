import React from "react";
import { Link } from "react-router-dom";
import { Mail, Briefcase, BookOpen, MessageSquare, Camera, Clapperboard, Sparkles } from "lucide-react";
import "./HomePage.css";

const quickActions = [
  { label: "View Projects", to: "/projects", icon: Briefcase },
  { label: "Read Resume", to: "/resume", icon: BookOpen },
  { label: "Sign Guestbook", to: "/guestbook", icon: MessageSquare },
];

function HomePage() {
  return (
    <div className="page-content">
      {/* Hero Section */}
      <section className="hero-section">
        <p className="breadcrumb">/home · Reese Ferguson</p>
        <h1 className="hero-title">Hi, I'm Reese!</h1>
        <p className="hero-tagline">
          Designer, developer, and organizer—creating meaningful digital experiences and community connections.
        </p>
        
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
      </section>

      {/* Quick Actions Grid */}
      <section className="quick-actions-section">
        <div className="quick-actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.to} className="quick-action-card">
                <Icon size={24} className="quick-action-icon" />
                <span className="quick-action-label">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <h2>About</h2>
        
        <div className="about-content">
          <p>
            Being exposed to the internet at too young an age was key to my development, as it allowed me to experiment with design and development on Scratch and create and edit video on early YouTube. I've been lucky enough to continue to work on things I love in adulthood, with key experiences as a{" "}
            <a href="https://saysi.org/" target="_blank" rel="noopener noreferrer">
              teaching artist at SAY Si
            </a>
            , a{" "}
            <a href="https://www.utsa.edu/pace/community-art/youth.html" target="_blank" rel="noopener noreferrer">
              youth artist instructor with UTSA
            </a>
            , an{" "}
            <a href="https://stonewallaction.org/" target="_blank" rel="noopener noreferrer">
              organizer with Stonewall Action
            </a>
            , and plenty of other opportunities in between.
          </p>
        </div>

        {/* Interests */}
        <div className="interests-section">
          <h3>Beyond Work</h3>
          <div className="interests-grid">
            <div className="interest-card">
              <Camera size={32} className="interest-icon" />
              <h4>Photography</h4>
              <p>Specializing in event and candid photography</p>
            </div>
            <div className="interest-card">
              <Sparkles size={32} className="interest-icon" />
              <h4>Pokémon TCG</h4>
              <p>Organizing a local card league</p>
            </div>
            <div className="interest-card">
              <Clapperboard size={32} className="interest-icon" />
              <h4>Film</h4>
              <p>
                <a href="https://letterboxd.com/rosematcha/" target="_blank" rel="noopener noreferrer">
                  Watching lots of movies
                </a>
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
