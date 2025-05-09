# rosematcha.com

Howdy! This is the monorepo for my personal site, [rosematcha.com](https://rosematcha.com/). This site serves both as a virtual business card and playground for projects.

## Project Structure

The repository is organized into several main sections:

### Root Files
- `index.html` - Temporary landing page that links to the various subprojects (to be replaced with a React site)
- `netlify.toml` - Main Netlify configuration file for deployment

### Subprojects

#### Bexar County Voting Data (/bexarvoting)
A visualization tool for tracking early voting turnout in Bexar County municipal elections. Built with vanilla JavaScript, Chart.js, and TailwindCSS

#### Pokémon Deck Viewer (/decks)
An Eleventy-based site for viewing and sharing Pokémon Trading Card Game decks. 
- Build Process:
  - Uses `src/` directory for source files
  - Generates static site in `_site/` directory
  - Card data parsed from .txt files in `deck-files/`

#### Favorite Film Friend Finder (/friendfinder)
A tool for finding Letterboxd users who share your taste in films. A single-page project written in raw HTML/CSS.

#### 4. BrahDB (/brahdb)
A visualization tool for the gospel of our greatest food critic, [ReportOfTheWeek](https://www.youtube.com/@TheReportOfTheWeek). Built with Vite, React, and TypeScript.

## Deployment

The site is deployed on Netlify with the following configuration:
- Domain: rosematcha.com
- Subprojects are accessible at their respective paths:
  - rosematcha.com/bexarvoting
  - rosematcha.com/decks
  - rosematcha.com/friendfinder
  - rosematcha.com/brahdb

## Adding a New Project (Subsite)

Supported project types include:
- **Raw HTML/JS/CSS** (static site)
- **Eleventy (11ty)** (static site generator)
- **React (Vite, CRA, etc.)** (SPA or static export)

### 1. Create Your Project Directory
- Place your new project in a top-level folder (e.g., `/myproject`).

### 2. Project Structure & Build Output
- **Raw HTML:** Place your `index.html` and assets directly in the new folder. No build step needed.
- **Eleventy:**
  - Place source in `/myproject/src` (or as preferred).
  - Configure Eleventy to output to `/myproject/_site`.
  - Your Netlify publish directory for this project will be `/myproject/_site`.
- **React (Vite, CRA, etc.):**
  - Place your app in `/myproject`.
  - Configure your build tool to output static files to `/myproject/dist` or `/myproject/build`.
  - Your Netlify publish directory for this project will be `/myproject/dist` or `/myproject/build`.

### 3. Asset & Data Paths
- **Always use subdirectory-relative paths for assets and data.**
  - Example: If your project is `/brahdb`, use `/brahdb/logos/logo.svg` or `/brahdb/data/data.json`.
  - Do **not** use `/logos/logo.svg` or `/data/data.json` (these will break in production).
- Update all fetches, image sources, and preloads to use the correct subdirectory prefix.

### 4. Netlify Configuration
- Update `netlify.toml` to add build and redirect rules for your new project.
- Example for a new project called `myproject`:
  ```toml
  [build]
    # ...existing build commands...

  [[redirects]]
    from = "/myproject/*"
    to = "/myproject/:splat"
    status = 200
  ```
- For SPAs, add a fallback rule to serve `index.html` for client-side routing.

### 5. Test Locally
- Serve your project locally and verify all assets load using the subdirectory path.
- For static sites, you can use `npx serve myproject/dist` or similar.

### 6. Deploy
- Commit your changes and push to the main branch.
- Netlify will build and deploy all subprojects automatically.
- Your new project will be live at `https://rosematcha.com/myproject`.

### 7. Add a Link
- Update the root `index.html` to add a link to your new project.

---

## ⚠️ Asset Path Requirements for Subdirectory Deployments
- All static assets and data fetches **must** use the subdirectory prefix (e.g., `/brahdb/`, `/decks/`, `/myproject/`).
- This is required for correct loading on Netlify and other static hosts where each project is served from a subdirectory.
- If you see 404 errors for assets in production, check your asset paths.

---