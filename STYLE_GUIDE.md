# Codebase Style Guide

This repository contains multiple projects (a primary React SPA in `src/`, Netlify Functions in `netlify/functions/`, and several standalone subprojects under folders like `brahdb/`, `garagesale/`, `bexarvoting/`, `friendfinder/`, and `moviemap/`). The rules below apply repository‑wide. Project‑specific exceptions are noted.

The goals: consistency, readability, and maintainability with minimal surprises.

---

## Naming Conventions

- Variables: camelCase (e.g., `isOpen`, `userId`, `fetchCount`).
- Functions/Methods: camelCase (e.g., `getUser`, `handleSubmit`).
- Classes/React Components: PascalCase (e.g., `Header`, `ResumePage`).
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_TIMEOUT_MS`).
- Booleans: use meaningful prefixes: `is`, `has`, `can`, `should`.
- React hooks: start with `use` (e.g., `usePrefersReducedMotion`).
- Files and Directories:
  - React components/pages: PascalCase files (e.g., `Header.jsx`, `ResumePage.jsx`).
  - Non‑component modules and utilities: kebab-case (e.g., `date-utils.js`).
  - Stylesheets: prefer kebab-case (e.g., `projects-page.css`). Existing PascalCase stylesheets are allowed; follow the local convention of the folder. New files should prefer kebab-case.
  - Assets (images/data): kebab-case where practical; do not rename existing assets solely for style.
- Private members:
  - TypeScript: prefer the `private` keyword.
  - JavaScript: prefix with a single leading underscore (e.g., `_cache`).

## Formatting

- Indentation: 2 spaces. No tabs.
- Line length: soft limit 100 characters. Wrap earlier for readability when it helps.
- Semicolons: required.
- Quotes: double quotes in JS/TS/JSX. Single quotes are acceptable in JSON5‑like tools, but JSON uses standard JSON quoting.
- Brace style: K&R (Egyptian) with opening brace on the same line.
- Spacing:
  - One space after commas and around binary operators: `const x = a + b;`.
  - No spaces just inside parentheses: `fn(arg1, arg2)`.
  - Trailing commas in multi‑line objects/arrays.
- Blank lines:
  - Separate logical blocks with a single blank line.
  - Keep imports grouped with a blank line between groups (see Import Ordering).
- EOF newline: required. No trailing whitespace.

## Import Ordering

Order and group imports as follows, with a blank line between groups and alphabetical within a group:

1. Node/built‑in modules
2. Third‑party packages
3. Absolute application imports (aliases)
4. Relative imports (`./`, `../`)
5. Side‑effect style imports (CSS) last when applicable

Examples (JSX):

- React first, then router, then local components, then styles.

## Commenting

- File header (optional but recommended for non‑trivial files): a short description of purpose/ownership.
- Functions/Components: use JSDoc when exported or non‑trivial.
  - `/** ... @param ... @returns ... */`
- Inline comments: only where the code is not self‑evident. Prefer clarifying the code instead of explaining it.
- TODOs/FIXMEs: `// TODO(owner-YYYY-MM-DD): detail` or `// FIXME(owner-YYYY-MM-DD): detail`.

## JavaScript/TypeScript Best Practices

- Declarations: prefer `const`, then `let`; never `var`.
- Functions:
  - React components: use function declarations for named components (`function Header() { ... }`).
  - Use arrow functions for callbacks and small inline handlers.
- Async:
  - Use `async/await` with `try/catch` for error handling. Never silently swallow errors.
  - For Promises, chain `.catch()` at the end if not using `await`.
- Nullish logic: prefer `??` and optional chaining `?.` where appropriate.
- Equality: strict equality `===`/`!==`.
- Exports: default export for primary component per file; named exports for utilities.

## React Conventions

- Routing:
  - Use `Link`/`NavLink` for internal navigation (never plain `<a>` for internal routes).
  - External links: `target="_blank"` with `rel="noopener noreferrer"`.
- Components:
  - One component per file. Co‑locate tiny subcomponents when they’re only used by the parent.
  - Keep components pure; derive state from props or memoize as needed.
- State & Effects:
  - Group related state together; use reducers for complex flows.
  - Clean up effects on unmount.
- Props:
  - Prefer explicit prop lists over rest‑spreads unless passing through.
  - Document non‑trivial props with JSDoc.
- Events: Prefix handlers with `on`/`handle` (e.g., `onClick`, `handleClick`).

## CSS and Design Tokens

- Design tokens live in `src/index.css` (`:root` variables). Do not hard‑code hex colors; consume tokens or use `color-mix` with tokens.
- Class names: kebab-case.
- Specificity: avoid IDs and `!important`; prefer utility classes and component/page scopes.
- Buttons: use the shared `.button` styles from `src/index.css`. Legacy aliases like `.geocities-button`/`.project-link-button` exist for backward compatibility but should not be introduced in new code.
- Layout:
  - Use the standard panel chrome (`.panel`) for containers.
  - Keep component/page CSS in the closest relevant file under the project.
- Inline styles: use only for dynamic values that are difficult to express via classes (e.g., dynamic widths). Extract repeated styles into classes.

## Accessibility

- Images: meaningful `alt` text; decorative images should have empty `alt`.
- Focus: preserve visible focus outlines; use `:focus-visible` tokens for custom rings.
- ARIA: add roles/labels only when semantic HTML is insufficient.
- Motion: respect `prefers-reduced-motion` and provide fallbacks.

## Modularity and Structure

- Project structure (primary SPA):
  - Pages in `src/pages/` (PascalCase JSX + optional page CSS).
  - Reusable components in `src/components/` (PascalCase JSX + optional CSS).
  - Global styles and tokens in `src/index.css`.
  - Assets in `src/assets/` and `public/`.
- Netlify Functions: Node style JS in `netlify/functions/` following Node environment rules.
- Standalone subprojects: follow this guide where feasible; keep each subproject’s build config self‑contained.

## Error Handling and Logging

- Always surface user‑visible errors where applicable (loading, error, empty states).
- Log with context: `console.error("[Guestbook] fetch failed", error)` instead of bare `console.error(error)`.
- Never leave empty catch blocks.

## Git Hygiene

- Commit messages: imperative mood, concise, explain why more than what when necessary.
- Keep diffs small and focused (style‑only vs. functional changes separately).

## Rationale for Key Decisions

- Arrow functions for callbacks provide concise lexical `this`.
- Function declarations for React components improve stack traces and readability.
- Centralized button and token usage reduce drift and one‑off styles.
- Import ordering improves scanability and diff stability.

## Linting/Formatting Tooling

- ESLint is configured in `eslint.config.js`. Extend as needed for Node functions.
- Optional (recommended): add Prettier and EditorConfig for editor‑enforced consistency. An `.editorconfig` is included to standardize indentation, newlines, and whitespace.

## Examples

- Internal navigation:
  - Use: `<Link to="/projects">View Projects</Link>`
  - Avoid: `<a href="/projects">View Projects</a>`
- External link: `<a href="https://example.com" target="_blank" rel="noopener noreferrer">`.
- Dynamic style OK: `<div style={{ width: widthPct + "%" }} />`.

---

Adhering to these rules will keep the repository cohesive, predictable, and easy to evolve across all subprojects.
