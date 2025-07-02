import React from "react";
import "./PageStyles.css";

function HomePage() {
  return (
    <div className="page-content">
      <p className="intro-paragraph">
        Howdy hi! I'm <strong>Reese</strong> (she/her), a Texas-based
        photographer, video editor, developer, graphic designer, tinkerer, organizer, and data analyst. <small>(I wear many hats...)</small>
      </p>

      <p>
        Being exposed to the internet at too young an age was key to my development, as it allowed me to experiment with design and development on Scratch and create and edit video on early YouTube. I've been lucky enough to continue to work on things I love in adulthood, with key experiences as a <a href="https://saysi.org/" target="_blank" rel="noopener noreferrer">teaching artist at SAY Sí</a>, a <a href="https://www.utsa.edu/pace/community-art/youth.html" target="_blank" rel="noopener noreferrer">youth artist instructor with UTSA,</a> an <a href="https://stonewallaction.org/" target="_blank" rel="noopener noreferrer">organizer with Stonewall Action,</a> and plenty of other opportunities in between.
      </p>

      <p>
        Outside of work, I pursue several personal interests. I do photography, with a speciality in event and candid photography. I'm also big into Pokémon cards! I collect them, play the game, and run tournaments at local card shops. I also <a href="https://letterboxd.com/rosematcha/" target="_blank" rel="noopener noreferrer">watch a lot of movies</a>.
      </p>

      <p>
      This site is hosted on <a href="https://www.netlify.com/" target="_blank" rel="noopener noreferrer">Netlify</a> and built with <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">ReactJS</a>. Many of the other sub-projects I have use <a href="https://www.11ty.dev/" target="_blank" rel="noopener noreferrer"> Eleventy</a> and <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer"> TailwindCSS.</a> I'm also experienced in <a href="https://wordpress.com/">WordPress</a>, and am currently learning about JAM-compatible CMSes.
      </p>
      <p className="paragraph-before-gif">
        Thanks for stopping by!
      </p>

      <div className="intro-image-container" style={{ textAlign: 'center', marginTop: '0', marginBottom: '25px' }}>
        <img
          src="/img/haruhi.gif"
          alt="Haruhi Suzumiya dancing"
          className="intro-gif"
        />
      </div>
    </div>
  );
}

export default HomePage;
