# rosematcha.com

Howdy! This is the monorepo for my personal site, [rosematcha.com](https://rosematcha.com/). This site serves both as a virtual business card and playground for projects.

## Project Structure

The repository is organized into several main sections:

### Root Project (/)
- Main site built with React + Vite
- Uses React Router for client-side navigation
- Features:
  - Homepage with personal introduction
  - Projects showcase page
  - Guestbook with Netlify Forms integration
  - (Resume page in development)

#### Important Root Files
- `index.html` - Entry point for the React application
- `vite.config.js` - Vite build configuration
- `package.json` - Main project dependencies
- `netlify.toml` - Netlify deployment configuration
- `src/` - React components and pages
  - `components/` - Reusable UI components
  - `pages/` - Route-specific page components
  - `assets/` - Static assets for main site

### Subprojects

#### Bexar County Voting Data (/bexarvoting)
A visualization tool for tracking early voting turnout in Bexar County municipal elections.
- **Tech Stack:** Vanilla JavaScript, Chart.js, TailwindCSS
- **Features:**
  - Real-time data visualization
  - Historical comparison
  - Location-based filtering
  - Mobile-responsive design
- **Structure:**
  - `index.html` - Single page application
  - `js/` - Modular JavaScript files
  - `csv/` - Election data files
  - Uses TailwindCSS via CDN for styling

#### BrahDB (/brahdb)
A visualization tool for ReviewBrah's fast food reviews from TheReportOfTheWeek YouTube channel.
- **Tech Stack:** Vite, React, TypeScript, TailwindCSS
- **Features:**
  - Dynamic filtering and sorting
  - Restaurant-specific views
  - Rating visualization
  - Mobile-responsive UI
- **Structure:**
  - Modern React application with TypeScript
  - Uses Vite for build tooling
  - Tailwind for styling
  - Static review data in JSON format

#### Favorite Film Friend Finder (/friendfinder)
A tool for finding Letterboxd users who share your taste in films.
- **Tech Stack:** Raw HTML/CSS/JavaScript
- **Features:**
  - Letterboxd profile parsing
  - User matching based on favorite films
  - Custom Letterboxd-inspired styling
- **Structure:**
  - Single HTML file with embedded CSS/JS
  - Uses web fonts (Graphik, Tiempos)
  - CORS proxy integration for API calls

#### Pokémon Deck Viewer (/decks)
An Eleventy-based site for viewing and sharing Pokémon Trading Card Game decks.
- **Tech Stack:** Eleventy (11ty), JavaScript
- **Features:**
  - Static site generation from deck files
  - Card data parsing
  - Deck visualization
- **Structure:**
  - `src/` - Source files and templates
  - `_site/` - Generated static site
  - `deck-files/` - Raw deck data files

## Deployment Configuration

The site is deployed on Netlify with the following structure:
- Domain: rosematcha.com
- Each subproject is accessible at its respective path:
  - rosematcha.com/ (React main site)
  - rosematcha.com/bexarvoting
  - rosematcha.com/brahdb
  - rosematcha.com/decks
  - rosematcha.com/friendfinder

### Build Configuration
- Main site: Vite build process
- Subprojects: Individual build processes as needed
- All builds configured in `netlify.toml`

## Adding a New Project (Subsite)

Supported project types include:
- **Raw HTML/JS/CSS** (static site)
- **Eleventy (11ty)** (static site generator)
- **React (Vite, CRA, etc.)** (SPA or static export)

### 1. Project Setup
- Create a top-level folder (e.g., `/myproject`)
- Follow the appropriate project structure based on type:
  - Raw HTML: Direct file placement
  - Eleventy: Source in `src/`, output to `_site/`
  - React/Vite: Source in project root, output to `dist/` or `build/`

### 2. Asset Path Configuration
- **Always use subdirectory-relative paths**
  - Example: `/myproject/assets/image.jpg`
  - Never use root-relative paths like `/assets/image.jpg`
- Update all asset references to use the correct subdirectory prefix
- This applies to:
  - Image sources
  - API endpoints
  - Static file references
  - CSS/JS imports

### 3. Netlify Configuration
Update `netlify.toml` with:
```toml
[[redirects]]
  from = "/myproject/*"
  to = "/myproject/:splat"
  status = 200
```
For SPAs, add client-side routing support.

### 4. Testing & Deployment
1. Test locally with proper subdirectory paths
2. Commit and push to main branch
3. Netlify will auto-deploy
4. Verify at rosematcha.com/myproject
5. Update the main site's project listing

## Asset Path Requirements
- All static assets must use subdirectory prefixes
- Required for correct loading in production
- Example:
  - ✅ `/brahdb/images/logo.svg`
  - ❌ `/images/logo.svg`

## Development Notes
- Each subproject maintains its own dependencies
- Main site uses React 18+ with React Router
- CSS approaches vary by project:
  - Main site: CSS Modules
  - BrahDB: Tailwind
  - Others: Project-specific

For more details on specific subprojects, see their respective README files.