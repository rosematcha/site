// src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./PageStyles.css";

function HomePage() {
  return (
    <div className="page-content">
      <p className="intro-paragraph">
        Howdy hi! I'm <strong>Reese</strong> (she/her), a Texas-based
        photographer, video editor, developer, graphic designer, tinkerer, organizer, data analyst, and
        advocate. <small>(I wear many hats...)</small>
      </p>

      <p>
        Being exposed to the internet at too young an age was key to my development, as it allowed me to experiment with design and development on Scratch and create and edit video on early YouTube. I've been lucky enough to continue to work on things I love in adulthood, with key experiences as a <a href="https://saysi.org/" target="_blank" rel="noopener noreferrer">teaching artist at SAY Sí</a>, a <a href="https://www.utsa.edu/pace/community-art/youth.html" target="_blank" rel="noopener noreferrer">youth artist instructor with UTSA,</a> an <a href="https://stonewallaction.org/" target="_blank" rel="noopener noreferrer">organizer with Stonewall Action,</a> and plenty of other opportunities in between.
      </p>

      {/* ADD CLASS TO THIS PARAGRAPH */}
      <p>
        When I'm not working, <small>(which I promise happens,)</small> I still stay busy! I love Pokémon cards, not just collecting them, but playing the card game too. I also <a href="https://letterboxd.com/rosematcha/" target="_blank" rel="noopener noreferrer">watch a lot of movies</a> and... {/* Consider finishing this sentence or rephrasing */}
      </p>

      {/*<div className="custom-marquee-container">
        <marquee
          behavior="scroll"
          direction="left"
          scrollamount="4"
          className="custom-marquee-text"
        >
          ✨ Check out my cool projects! ✨ This site is built with modern tech
          but with a nostalgic heart! ✨ Thanks for visiting! ✨ Don't forget to
          sign my <Link to="/guestbook">Guestbook</Link>! ✨
        </marquee>
      </div>

      <h3 className="section-heading-alt">A Bit About This Place</h3>
      <p>
        I wanted to create a space that's a nod to the creative, quirky, and
        personal homepages of the late 90s and early 2000s, but built with
        today's tools. It's a fun experiment in blending nostalgia with modern
        web development.
      </p>*/}
      <p>
      This site is hosted on <a href="https://www.netlify.com/" target="_blank" rel="noopener noreferrer">Netlify</a>, a free static hosting service,
      and built with <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">ReactJS</a>. Many of the other sub-projects I have use
      <a href="https://www.11ty.dev/" target="_blank" rel="noopener noreferrer"> Eleventy</a> and <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer"> TailwindCSS.</a> While it's objectively better in like, 99% of cases, I'll use WordPress when I'm dead.
      </p>
      <p className="paragraph-before-gif">
        Thanks for stopping by!
      </p>

            {/* === HARUHI GIF SECTION === */}
      {/* MODIFIED INLINE STYLE FOR MARGINS */}
      <div className="intro-image-container" style={{ textAlign: 'center', marginTop: '0', marginBottom: '25px' }}>
        <img
          src="/img/haruhi.gif"
          alt="Haruhi Suzumiya dancing"
          width="147" // UPDATED
          height="147" // UPDATED
          className="intro-gif"
        />
        {/* <p style={{fontSize: '0.8em', color: '#ffb3da', marginTop: '5px'}}><small>Endless Eight never again...</small></p> */}
      </div>
      {/* === END HARUHI GIF === */}

    </div>
  );
}

export default HomePage;
