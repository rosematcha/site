// Centralized project data for reuse (listing and intelligent preloading)
export const projectsData = [
  {
    id: "ciphermaniac",
    title: "Ciphermaniac",
    path: "https://ciphermaniac.com/",
    thumbnail: "/img/projects/ciphermaniac-thumb.jpg",
    thumbnailWidth: 327,
    thumbnailHeight: 184,
    description:
      "To show my local players what cards are frequently used in the Pokémon card game, I created this tool tracking the usage of cards in major tournaments. Now with over 1,000 daily users.",
    tech: ["react", "node.js", "tailwindcss"],
    tags: ["data visualization", "pokémon"],
  },
  {
    id: "moviemap",
    title: "Movie Map",
    path: "/moviemap",
    thumbnail: "/img/projects/moviemap-thumb.jpg",
    thumbnailWidth: 327,
    thumbnailHeight: 184,
    description:
      "Visualizing the connections between people's four favorite movies on Letterboxd.",
    tech: ["d3.js", "python"],
    tags: ["data visualization", "letterboxd", "weekend project"],
  },
  {
    id: "matchatab",
    title: "MatchaTab",
    path: "https://addons.mozilla.org/en-US/firefox/addon/matchatab/",
    thumbnail: "/img/projects/matchatab-thumb.jpg",
    thumbnailWidth: 330,
    thumbnailHeight: 183,
    description:
      "Inspired by Tabliss, a deeply customizable and modular new tab page to meet my needs. Built for Firefox browsers.",
    tech: ["javascript", "html", "css"],
    tags: ["browser extension", "weekend project"],
    buttonText: "Install on Firefox",
  },
  {
    id: "brahdb",
    title: "BrahDB",
    path: "/brahdb",
    thumbnail: "/img/projects/brahdb-thumb.jpg",
    thumbnailWidth: 333,
    thumbnailHeight: 184,
    description:
      "A visualization tool of the gospel of ReportOfTheWeek, with data scraped, collected, and transformed from subtitles.",
    tech: ["vite", "react", "typescript"],
    tags: ["data visualization", "weekend project"],
  },
  {
    id: "bexarvoting",
    title: "Bexar County Voting Data",
    path: "/bexarvoting",
    thumbnail: "/img/projects/bexarvoting-thumb.jpg",
    thumbnailWidth: 327,
    thumbnailHeight: 184,
    description:
      "Dissatisfied with the County's lack of transparency, I created a site to visualize historical and present Bexar County voting data.",
    tech: ["javascript", "chart.js", "tailwindcss"],
    tags: ["data visualization", "civic tech"],
  },
  {
    id: "friendfinder",
    title: "Favorite Film Friend Finder",
    path: "/friendfinder",
    thumbnail: "/img/projects/friendfinder-thumb.jpg",
    thumbnailWidth: 327,
    thumbnailHeight: 184,
    description:
      '<a href="https://x.com/rachellapides/status/1868875739732623414" target="_blank" rel="noopener noreferrer">Inspired by a Tweet,</a> a simple tool for finding Letterboxd users with your same top four favorite films.',
    tech: ["javascript", "html", "css"],
    tags: ["static site", "letterboxd", "weekend project"],
  },
];
