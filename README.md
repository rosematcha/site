# Personal Website (rosematcha.com)

This repository contains the source code for my personal website hosted at rosematcha.com. The site is built as a collection of individual projects that are deployed together on Netlify.

## Project Structure

The repository is organized into several main sections:

### Root Files
- `index.html` - Temporary landing page that links to the various subprojects (to be replaced with a React site)
- `netlify.toml` - Main Netlify configuration file for deployment

### Subprojects

#### 1. Bexar County Voting Data (/bexarvoting)
A visualization tool for tracking early voting turnout in Bexar County municipal elections.
- Built with vanilla JavaScript, Chart.js, and TailwindCSS
- Data sourced from the Bexar County Elections Department
- Features:
  - Interactive charts showing voting data over time
  - Location-specific data filtering
  - Historical data comparison

#### 2. Pokémon Deck Viewer (/decks)
An Eleventy-based site for viewing and sharing Pokémon Trading Card Game decks.
- Built with 11ty (Eleventy) static site generator
- Features:
  - Interactive deck viewing interface
  - Card image previews
  - PTCGL export format support
  - Responsive design
- Build Process:
  - Uses `src/` directory for source files
  - Generates static site in `_site/` directory
  - Card data parsed from .txt files in `deck-files/`

#### 3. Favorite Film Friend Finder (/friendfinder)
A tool for finding Letterboxd users who share your taste in films.
- Single-page application
- Uses the Letterboxd website to find users with similar favorite films
- Features:
  - User profile lookup
  - Favorite film matching
  - Direct links to matching profiles

#### 4. BrahDB (/brahdb)
A database visualization tool.
- Built with Vite, React, and TypeScript
- Features fast food brand visualization

## Deployment

The site is deployed on Netlify with the following configuration:
- Domain: rosematcha.com
- Subprojects are accessible at their respective paths:
  - rosematcha.com/bexarvoting
  - rosematcha.com/decks
  - rosematcha.com/friendfinder
  - rosematcha.com/brahdb

Planned subpages:
- rosematcha.com/portfolio
- rosematcha.com/projects
- rosematcha.com/resume

## Future Plans
The temporary root index.html will be replaced with a React-based site that will provide a more cohesive experience across all projects.

## Local Development

Each subproject can be developed independently:

1. BexarVoting:
   - Pure HTML/JS/CSS, can be served directly
   - Uses Chart.js for data visualization

2. Decks:
   - Requires Node.js
   - Built with Eleventy
   - Run `npm install` in the decks directory
   - Use `npm run serve` for development

3. FriendFinder:
   - Static HTML/JS site
   - No build process required

4. BrahDB:
   - Vite + React + TypeScript project
   - Run `npm install` in the brahdb directory
   - Use `npm run dev` for development