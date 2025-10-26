# ReviewBrah Fast Food Reviews Web App

A modern, responsive React + Tailwind web app for cataloging and exploring ReviewBrah's fast food reviews. Designed for clarity, speed, and extensibility, with a focus on real-time filtering, beautiful UI, and future-proof architecture.

---

## 🚀 Features
- **Modern, dark-mode UI** with responsive design
- **Review catalog**: Each review shows restaurant logo, item name, restaurant name, rating (color-scaled), date, and YouTube link
- **Restaurant logos**: SVGs mapped to enums, always left-aligned, no colored backgrounds
- **Rating color scale**: 1.0 = red, 9.0 = muted green, 9.5+ = gold glow
- **Filter bar**: Big search, advanced modal (restaurant, rating, date, sort, clear)
- **Real-time filtering, sorting, and review count**
- **Pagination**: 50 reviews per page, with Next/Previous controls
- **Stats page**: Top 10 reviewed restaurants (bar graph, Balatro-style), ratings distribution (Letterboxd-style)
- **Custom loading spinner**: ReviewBrah's head spins and fades in/out during loading
- **Extensible for lazy loading/async data**

---

## 🗂️ Project Structure & Backend Layout

```
reviewbrah-db/
├── public/
│   └── loading.png           # Custom spinner image (ReviewBrah's head)
├── src/
│   ├── App.tsx               # Main app logic, routing, state, pagination, loading
│   ├── Stats.tsx             # Stats page (top restaurants, ratings distribution)
│   ├── data/
│   │   └── realReviews.ts    # All review data (array of Review objects)
│   ├── types/
│   │   └── Review.ts         # TypeScript types (Review, Restaurant enum)
│   ├── components/
│   │   ├── ReviewCard.tsx    # Review card UI (logo, item, rating, etc.)
│   │   └── LoadingSpinner.tsx# Custom spinner component
│   └── logos/                # SVG logo files for each restaurant
└── README.md                 # This documentation
```

### Data Backend
- **No server-side backend**: All data is static, stored in `src/data/realReviews.ts` as a TypeScript array.
- **Review structure** (`Review`):
  - `restaurant`: enum (see `types/Review.ts`)
  - `itemName`: string
  - `rating`: number (1–10, decimals allowed)
  - `reviewDate`: ISO string (YYYY-MM-DD)
  - `reviewLink`: string (YouTube URL)
- **Restaurant enum**: Includes all major chains and special cases (Applebees, BuffaloWildWings, Coke, Dennys, ShakeShack, Zaxbys, PaneraBread, Other).
- **Logos**: SVGs in `/src/logos/`, mapped by enum in `ReviewCard.tsx`.

---

## ⚠️ Netlify/Production Asset Paths
- **All static asset and data fetches must use `/brahdb/` as the prefix in production.**
  - Logos: `/brahdb/logos/{logo}.svg`
  - Reviews: `/brahdb/reviews/reviews.json`
- This is required for correct loading on Netlify and other static hosts where BrahDB is served from a subdirectory.
- **Do not use root-relative paths like `/logos/` or `/reviews/` in production code.**
- Example (React):
  ```tsx
  // Correct:
  <img src={`/brahdb/logos/${logo}.svg`} alt="Logo" />
  // Incorrect:
  <img src={`/logos/${logo}.svg`} alt="Logo" />
  ```
- Example (fetch):
  ```ts
  // Correct:
  fetch('/brahdb/reviews/reviews.json')
  // Incorrect:
  fetch('/reviews/reviews.json')
  ```
- If you see 404 errors for logos or reviews in production, check that all asset paths use the `/brahdb/` prefix.

---

## 🎨 UI/UX & Design Specs
- **Dark mode**: All backgrounds and controls use dark, accessible colors.
- **Responsive**: Layout adapts to mobile, tablet, and desktop.
- **Review card layout**:
  - Horizontal strip: logo (left), item/restaurant (center), rating/date/link (right)
  - Logo: always left, no colored background, max 16x16 (rem units)
  - Restaurant name always visible under item name, even on mobile
  - Rating: color from red (1.0) to muted green (9.0), gold glow for 9.5+
  - No "/10" after ratings
- **Filter bar**:
  - Large search input
  - "Filters" button opens modal for advanced filters (restaurant, rating, date, sort, clear)
  - All filtering/sorting is real-time
- **Pagination**:
  - 50 reviews per page
  - "Previous" and "Next" buttons, current/total page display
  - Pagination applies to filtered/sorted list
- **Stats page**:
  - Top 10 restaurants: horizontal bar graph, logo, name, count (Balatro-style)
  - Ratings distribution: vertical bar graph, 1–10 stars, counts (Letterboxd-style, ratings rounded to nearest integer)
  - Navigation: "Stats" button in header, "Back to Reviews" on stats page
- **Loading spinner**:
  - ReviewBrah's head spins, fades in/out over reviews section when loading
  - Accessible alt text
  - Ready for async/lazy loading

---

## 🛠️ How to Run & Develop
1. **Install dependencies** (if any; Tailwind is via CDN, so minimal setup)
2. **Start dev server** (e.g., `npm start` or `yarn start` if using Create React App/Vite)
3. **Open in browser**: [http://localhost:3000](http://localhost:3000) (or as configured)
4. **Edit data**: Add/edit reviews in `src/data/realReviews.ts` (follow the Review type)
5. **Add logos**: Place new SVGs in `src/logos/` and update the mapping in `ReviewCard.tsx`
6. **Deploy**: Static build works with Netlify, Vercel, etc.

---

## 🧩 Extending the App
- **Lazy loading/async data**: Use the `loading` state and `setLoading` in `App.tsx` to show the spinner while fetching or loading more reviews.
- **Adding new restaurants**: Update the `Restaurant` enum, add logo SVG, and update the mapping in `ReviewCard.tsx`.
- **Adding new stats**: Extend `Stats.tsx` with new graphs or metrics as needed.
- **Changing reviews per page**: Edit `REVIEWS_PER_PAGE` in `App.tsx`.

---

## 📝 Notes for New Developers
- **All review data is static** for now, but the architecture is ready for async/lazy loading.
- **UI is built with React and Tailwind (CDN)** for instant utility class support.
- **No routing library**: Page swapping is handled by state in `App.tsx` for simplicity and static deployment.
- **All filtering, sorting, and pagination** are performed on the client, in-memory.
- **Stats page** is a separate component, not a route.
- **Loading spinner** is reusable for any async operation - just set `loading` to `true`.
- **Design is modern, accessible, and mobile-friendly**.
- **SVG logos** must be named and mapped exactly as in the enum/mapping.
- **If the database grows large**, consider splitting `realReviews.ts` or loading data in chunks (see lazy loading section).

---

## 📁 File Structure (Summary)
- `src/App.tsx` - Main app, state, filtering, pagination, loading, navigation
- `src/Stats.tsx` - Stats page (top restaurants, ratings distribution)
- `src/data/realReviews.ts` - All review data
- `src/types/Review.ts` - Types and enums
- `src/components/ReviewCard.tsx` - Review card UI and logo mapping
- `src/components/LoadingSpinner.tsx` - Custom spinner
- `src/logos/` - SVG logos
- `public/loading.png` - Spinner image

---

## 🏁 Handoff Checklist
- All code is TypeScript, well-typed, and modular
- README is up to date (this file)
- All SVG logos are present and mapped
- Data is clean, consistently formatted, and extensible
- App is ready for static deployment (Netlify, Vercel, etc.)
- For any new feature, follow the established patterns for state, UI, and data

---

**If you're a new developer/agent:**
- Read this README fully
- Explore the codebase as described above
- Follow the design and data conventions
- Ask for clarification only if something is not covered here!

---

Enjoy working on ReviewBrah's Fast Food Reviews! 🍔🍟
