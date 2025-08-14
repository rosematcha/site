# Copilot Instructions for `site`

Authoritative guidelines for assistants and contributors editing this repo. Follow these rules to avoid regressions and maintain the new design.

## Golden rules
- Never introduce React key collisions.
  - Lists must have stable, unique keys. Do not reuse the same `key` values in duplicated content.
  - When duplicating arrays for seamless marquee/loops, generate distinct keys per pass (e.g., suffix `-a`/`-b` or offset indices).
  - Prefer real IDs when available; fall back to prefixed indices only for static lists.
- Validate after edits.
  - Fix all console warnings/errors locally before finalizing (especially React key warnings).
  - Run linters and type checks where applicable; use the editor diagnostics to confirm zero errors.
- Preserve architecture and design system.
  - Routing stays in `src/App.jsx` with `<BrowserRouter>` in `src/main.jsx`.
  - Header uses `.main-header.panel > .header-inner` with the pink XP/7 gradient.
  - Footer is a retro marquee: `.retro-marquee .marquee > .marquee__track` with CSS-driven animation.
  - Page content should live inside a `.panel` card (see `App.jsx`).
- Use the theme tokens in `src/index.css`.
  - Color variables: `--brand` and `--brand-2` (pink-forward), `--bg`, `--panel`, `--panel-2`, `--text`, `--muted`, `--border`, `--ring`.
  - Do not hardcode arbitrary colors; prefer the variables and existing gradients.
  - Micro-interactions: use `--press-scale` and `--press-dur` for press feedback. Buttons and button-like links must scale to `var(--press-scale, 0.97)` on `:active` with a transform transition of `var(--press-dur, 150ms)`.
- Prefer CSS animations to JS intervals.
  - If JS timers are necessary, always clean up effects and avoid multiple registrations (Strict Mode double-invokes effects in dev).
- Keep accessibility in mind.
  - Use semantic elements, label interactive controls, ensure contrast, and respect `prefers-reduced-motion` (disable non-essential transitions/animations for large/continuous effects).
- Don’t break Netlify flows.
  - Guestbook keeps Netlify Forms attributes and the `.netlify/functions` fetch path.
  - Don’t rename or move public assets without updating references.

## Site Style Guide (authoritative)
Use this guide to produce consistent UI across pages. The single source of truth is `src/index.css`.

- Design tokens (in `:root`):
  - Colors: `--bg`, `--panel`, `--panel-2`, `--text`, `--muted`, `--brand`, `--brand-2`, `--border`, `--ring`.
  - Motion: `--press-scale`, `--press-dur`.
  - Spacing scale: `--space-1..8` used by utilities.
- Typography:
  - Headings `h1..h3` use the scale defined in `index.css`. Don’t override size per-page; use semantic elements.
  - Body text defaults from `body` styles; avoid per-page font declarations.
  - ABSOLUTE: Do not use em dashes (U+2014). Replace with a spaced hyphen (" - "), commas, parentheses, or rephrase. Search for the character `—` before committing; it must not appear anywhere in code, content, or docs.
- Layout:
  - Wrap routed content with `<main class="panel page">` (padding comes from `.page`).
  - Avoid inline styles for spacing. Use utilities: `text-center`, `mt-[1..8]`, `mb-[1..8]`, `mr-[1..2]`.
- Header and nav pills:
  - Only one canonical header block exists in `src/index.css`. Do not re-declare `.main-header.panel`, `.header-inner`, `.main-header .main-nav`, `.main-header .main-nav a`, `.site-title-link`, `.site-title-link .badge` elsewhere.
- Buttons and links:
  - Use the shared `.button` (also applied to `.geocities-button`, `.project-link-button`, `.submit-button`) styles from `index.css`.
  - No component-level button re-styling; do not redefine button colors in page CSS.
  - Emojis must not be used as icons in buttons. Avoid decorative emoji before/after button text (e.g., resume PDF/print/email/web/GitHub). If an icon is required, use an inline SVG with `class="icon-inline mr-2"`, mark it `aria-hidden="true"`, and keep a clear text label.
- Forms:
  - Use the shared input/textarea styles in `index.css`. Focus rings use `--ring`.
- Images and icons:
  - Inline icons next to text should use `class="icon-inline mr-2"` to align and space.
- Motion and accessibility:
  - Respect `prefers-reduced-motion`. Large/continuous animations must disable under `html:not(.allow-motion)`.
- Prohibitions:
  - No ad-hoc hex/RGB in new CSS. Use tokens and theme mixes.
  - Avoid inline styles. If a one-off is absolutely required (e.g., Netlify honeypot), prefer a utility class like `.hidden`.

## Footer marquee: implementation contract and guardrails

Use this section to prevent regressions to the footer marquee.

- Structure (must match):
  - DOM: `<footer class="footer panel retro-marquee" role="contentinfo"><div class="marquee" aria-hidden="true"><div class="marquee__track">…</div></div></footer>`
  - Only one moving track at a time; rotate quotes per pass.
- CSS (single source in `src/index.css`):
  - Container `.retro-marquee .marquee`: `position: relative; overflow: hidden; width: 100%; min-height: var(--marquee-h, 44px);` with gradient using theme tokens.
  - Track `.retro-marquee .marquee__track`: `position: absolute; left: 100%; top: 50%; transform: translateY(-50%); white-space: nowrap; pointer-events: none;`.
  - Keyframes name: `marquee-run`.
    - From: `transform: translateY(-50%) translateX(0)`
    - To: `transform: translateY(-50%) translateX(var(--marquee-x-end, calc(-100vw - 100%)))` (CSS var allows container-based distance runtime override).
  - Reduced motion: disable animation with `@media (prefers-reduced-motion: reduce)` and scope with `html:not(.allow-motion)` so devs can test via override.
- JS/React behavior (see `src/components/Footer.jsx`):
  - State: `{ quote, cycle }`. Use key={`marquee-cycle-${cycle}`} on track to restart cleanly per pass.
  - On mount and each cycle:
    1) Measure `distance = container.clientWidth + track.scrollWidth`.
    2) Compute duration at a fixed speed (e.g., 80px/s), minimum 8000ms.
    3) Apply `--marquee-x-end: -{distance}px` and start the animation deterministically: clear `track.style.animation`, force reflow, then set `track.style.animation = `marquee-run {durationMs}ms linear 1``.
  - On `animationend`: pick a new random quote (avoid immediate repeat) and increment `cycle`.
  - Strict Mode safe: do not leave dangling listeners; prefer React's `onAnimationEnd` or add/remove DOM listeners in the same effect.
  - Restart on resize to recompute duration.
- Accessibility:
  - Keep the moving text `aria-hidden="true"` within the marquee container to avoid repeated announcements.
  - If needed, mirror the current quote into a visually-hidden static region outside the animated element.
- Reduced-motion behavior and dev override:
  - Respect user setting and render a static, centered quote when reduced motion is enabled.
  - Dev/test override supported: add `?motion=on` to the URL or add `<html class="allow-motion">` to force animation locally without changing OS settings.

### Footer panel chrome (prevent white edges)
- Footer must use the standard panel gradient and clip it to the padding box:
  - CSS: `footer.footer.panel { background: linear-gradient(180deg, var(--panel), var(--panel-2)); background-clip: padding-box; }`
- Disable the shared panel bevel overlay for the footer to avoid white top/bottom highlights:
  - CSS: `footer.footer.panel::before { display: none; }`
- The marquee container stays transparent and inherits the panel radius:
  - CSS: `.retro-marquee .marquee { background: transparent; border-radius: inherit; height: 100%; }`
- Do not add a border-top or separate background on the marquee; the panel provides the chrome.

- Validation (must verify before completion):
   - No React key warnings; only one track per pass.
   - No horizontal overflow: confirm `document.documentElement.scrollWidth === window.innerWidth` at 360, 768, 1200.
   - Animation runs and quote changes at the end of each pass; duration scales with marquee container width (not viewport width).
   - Reduced motion disables animation; `?motion=on` forces it for testing.
   - Colors/gradients use theme tokens; no ad-hoc hex.
   - Footer has no white bands: computed styles show `footer.footer.panel::before` is `display: none` and `background-clip: padding-box` is applied; `.retro-marquee .marquee` background is `transparent`.

- Common failure modes and quick fixes:
   - Animation not running: ensure `track.style.animation` is cleared, reflow forced, then the shorthand is set; verify `marquee-run` keyframes exist; check that reduced-motion isn’t disabling it (use `?motion=on`).
   - Cycle not advancing: ensure `onAnimationEnd` is wired and the track has a unique `key` per cycle.
   - Scroll width overflow: confirm the track is absolutely positioned and the container has `overflow: hidden`.
   - Excessive duration on wide screens: ensure `--marquee-x-end` is set to `-(containerWidth + trackWidth)px` rather than using `100vw`.
   - White band at top/bottom of footer: caused by the shared `.panel::before` bevel overlay. Fix by disabling it on the footer (`footer.footer.panel::before { display: none; }`) and ensure the footer background uses the panel gradient with `background-clip: padding-box`.

## Patterns and snippets

### A. Seamless marquee without duplicate keys
When duplicating the list for continuous scrolling, keys in the second pass must be different:

```jsx
const first = items.map((item, i) => (
  <span key={`item-${i}-a`}>{item}</span>
));
const second = items.map((item, i) => (
  <span key={`item-${i}-b`}>{item}</span>
));
return [...first, ...second];
```

Alternatively, offset indices:

```jsx
const len = items.length;
return [
  ...items.map((it, i) => <span key={`it-${i}`}>{it}</span>),
  ...items.map((it, i) => <span key={`it-${i + len}`}>{it}</span>),
];
```

### B. NavLink usage
Home link should use `end` to avoid staying active on subroutes:

```jsx
<NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
  Home
</NavLink>
```

### C. Panels and buttons
Use the shared styles in `src/index.css` - avoid redefining buttons/forms per component. Wrap routed content in a `.panel`.

### D. Marquee rules (prevent width blowouts)
- The marquee container must be `position: relative; overflow: hidden; width: 100%`.
- The moving track must be `position: absolute; left: 100%; top: 50%; transform: translateY(-50%);` and use a CSS animation that translates X negatively.
- Do NOT rely on track intrinsic width to drive layout; absolutely position it so it cannot expand page width.
- Respect `prefers-reduced-motion` and disable the animation accordingly.

### E. No horizontal overflow
- `html, body { overflow-x: hidden; }` and `#root { overflow-x: clip; }` must remain unless a strong reason is documented.
- New components must not set widths using viewport units that can exceed container.

### F. Validation before completion
- Inspect DevTools “Layout shift” and scroll width; ensure `document.documentElement.scrollWidth === window.innerWidth`.
- Manually test at 360, 768, 1200 widths; ensure no x-scroll.

## CSS governance: header and nav pills (authoritative)
- Single source of truth: Header styles must live in one canonical block in `src/index.css`.
  - Only one section may define these selectors: `.main-header.panel`, `.header-inner`, `.main-header .main-nav`, `.main-header .main-nav a`, `.site-title-link`, `.site-title-link .badge`.
  - Do not re-declare these selectors later in the file. Avoid cascading "last-wins" hotfixes.
- Overflow and padding
  - `.main-header.panel { overflow: visible; padding: 12px 16px; background-clip: padding-box; }` must be preserved.
  - Do not set `overflow: hidden` on the header.
- Vertical sizing/centering
  - Own vertical size on `.header-inner` via `min-height: var(--header-min-h, 60px); align-items: center;`.
  - Do not rely on asymmetric top/bottom padding for centering.
- Nav pills
  - Use `display: inline-flex; align-items: center; justify-content: center; height: var(--pill-h, 30px);`.
  - Do not use `inline-grid` for pill links.
- Tokens
  - Size tweaks go through vars: `--header-min-h`, `--pill-h`. Do not hardcode values in multiple places.

## Pre-commit checklist additions
 1. Search `src/index.css` for `.main-header` – confirm there is a single canonical section and no duplicate selector blocks.
 2. Verify computed styles in DevTools at 360/768/1200:
    - `.header-inner`: `min-height >= 56px`, `align-items: center`.
    - `.main-header.panel`: `overflow: visible`, vertical padding symmetric.
    - `.main-nav a`: `display: inline-flex`, text is visible.
 3. Confirm `document.documentElement.scrollWidth === window.innerWidth` (no x-scroll).
 4. Footer checks:
    - `footer.footer.panel` uses the panel gradient and `background-clip: padding-box`.
    - `footer.footer.panel::before` is `display: none` (no bevel overlay).
    - `.retro-marquee .marquee` has `background: transparent; border-radius: inherit;` and no extra borders.
 5. Scan for U+2014: search for the character `—` in code, content, and docs. It must not appear anywhere; replace with a spaced hyphen (" - "), commas, parentheses, or rephrase.

## Common gotchas (expanded)
- Duplicate CSS selectors for the header creating conflicting overflow/padding/min-height.
- Switching pills to `inline-grid` causing text mis-centering or collapse.
- Reintroducing `overflow: hidden` on `.main-header.panel` clipping content.

## Editing checklist (must pass before completion)
1. No console warnings/errors (esp. React key collisions).
2. Lint/diagnostics show zero errors.
3. Header, main panel, and footer render correctly at 360px, 768px, 1200px widths.
4. Links and forms are keyboard-accessible and focus-visible.
5. Colors and spacing use the theme tokens (no ad-hoc hex/RGB).
6. Netlify guestbook still submits and fetches.
7. Buttons/CTA links have press feedback: `:active` scales to ~`0.97` using the shared tokens; verify it doesn’t cause layout shift and respects `prefers-reduced-motion`.

## Style and content rules
- Keep responses to the user short and impersonal.
- If asked for the assistant name, reply “GitHub Copilot”.
- Avoid printing file diffs in chat - apply edits via the editor.
- For new components, co-locate CSS with existing patterns or extend `index.css` tokens.
- Don’t introduce heavy dependencies for simple UI effects.

## Common gotchas to avoid
- Duplicate React keys in repeated/duplicated lists (cause: marquee duplication).
- JS-driven animations without cleanup, leading to duplicated timers in dev.
- Regressing header/footer structure (removing required class hooks).
- Hardcoding colors breaking light/dark or theming.
- Breaking public asset paths used by `copy-static` in `package.json`.

This document should be kept up-to-date as the design system evolves.
