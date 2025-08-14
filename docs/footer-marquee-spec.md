# Footer Marquee Spec

Author: site team
Status: Draft (ready to implement)
Scope: Footer only (retro marquee)

## Goals
- Right-to-left marquee that starts offscreen (right) and exits offscreen (left).
- Shows one random quote from `src/assets/quotes.js` per pass.
- After one full pass completes, selects a new random quote and restarts.
- Visual vibe: Windows XP / Vista / 7-era glossy/gradient feel, matching existing design tokens.
- Zero horizontal overflow and no React key collisions.

## Non-goals & constraints
- No deprecated <marquee> tag; CSS animations preferred over JS timers.
- Do not hardcode colors; use theme tokens in `src/index.css` (`--brand`, `--brand-2`, `--bg`, `--panel`, `--text`, etc.).
- Must respect prefers-reduced-motion.
- Must not break Netlify flows or routing structure.
- Follow marquee rules and overflow rules from `.github/copilot-instructions.md`.

## UX behavior
- Lives in site footer within a `.panel` wrapper.
- Container is full-width, clipped to its own bounds, with a subtle XP/7-like sheen/gradient using `--brand`/`--brand-2`.
- Text scrolls smoothly from right to left; no stutter or jumps.
- One iteration per quote. When it finishes, content swaps to a new quote and animation restarts.
- On reduced motion, animation is disabled; a single quote is displayed statically.

## DOM structure (canonical)
```
<footer class="panel retro-marquee" role="contentinfo">
  <div class="marquee" aria-hidden="true">
    <div class="marquee__track">{quote text}</div>
  </div>
</footer>
```
- Footer remains semantic. The moving text container uses `aria-hidden="true"` to avoid repetitive announcements by screen readers. Optionally mirror the current quote elsewhere in a visually-hidden live region if needed.

## CSS specification
Selectors must follow the repo guidance: `.retro-marquee .marquee > .marquee__track` and CSS-driven animation.

Container
- `.retro-marquee .marquee`:
  - position: relative; overflow: hidden; width: 100%;
  - min-height driven by a token (e.g., `--pill-h` or a new `--marquee-h`).
  - Visual: gradient background/border accents using `--brand` and `--brand-2`; no raw hex.

Track
- `.retro-marquee .marquee__track`:
  - position: absolute; left: 100%; top: 50%; transform: translateY(-50%);
  - white-space: nowrap; will-change: transform; pointer-events: none;
  - Animation: keyframes translateX from 0 to fully offscreen left.

Animation keyframes
- Name: `marquee-run`.
- From: `transform: translateY(-50%) translateX(0);`
- To:   `transform: translateY(-50%) translateX(calc(-100vw - 100%));`
  - Rationale: starting with left: 100%, translating by `-100%` moves the track so its right edge aligns at the container's left edge; an additional `-100vw` ensures it exits fully offscreen. Track is absolutely positioned, so no layout width blowouts.
- Duration: set via variable `--marquee-dur` (JS will compute per-quote by speed; see below). Timing: linear. Iteration count: 1.

Reduced motion
- `@media (prefers-reduced-motion: reduce)`:
  - Remove animation; keep the quote centered or left-aligned; no auto-rotation.

No horizontal overflow
- The track is absolutely positioned and overflow is hidden on container. Confirm `document.documentElement.scrollWidth === window.innerWidth` at 360/768/1200 widths.

## Theming and visuals (XP/7 vibe)
- Use existing pink-forward tokens. Example treatments:
  - Subtle vertical gradient across the marquee bar using `--brand` → `--brand-2`.
  - 1px inner highlight and outer border using `--border`.
  - Slight glow on text using `text-shadow` derived from `--panel`/`--brand-2` (guarded by reduced motion if animated shadows are considered).
- Respect button-like micro-interactions only for actionable elements; the marquee text itself is non-interactive.

## Quotes source
- Import from `src/assets/quotes.js`.
- Selection rules:
  - Uniform random.
  - Avoid immediate repeat of the previous quote.
  - Optional: keep a short history window (last 3) to reduce quick repeats.

## JS/React behavior
- Component: `FooterMarquee` (or integrate into existing Footer) within a `.panel` container.
- State: `{ quote, cycle, durationMs }`.
- Refs: `containerRef`, `trackRef` for measuring and attaching listeners.
- Lifecycle:
  1. On mount, pick initial quote and set `cycle = 0`.
  2. Measure: compute total travel distance = containerWidth + trackWidth.
  3. Use a speed token (e.g., `--marquee-speed: 80px/s`) to derive `durationMs = distance / speed`.
  4. Apply `style.animationDuration = durationMs + 'ms'` to `.marquee__track`.
  5. Start animation by rendering the track with `key = 'marquee-' + cycle`.
  6. On `animationend`, select a new random quote, increment `cycle`, recompute duration (measure again), and rerender (new `key` restarts the animation deterministically).
- Strict Mode safety:
  - Register the `animationend` listener once on the track element and always clean it up in `useEffect` cleanup.
  - Avoid intervals; let CSS drive timing.

## Accessibility
- The moving text is `aria-hidden` to avoid noisy announcements.
- If the footer needs its content conveyed to assistive tech, mirror the current quote in a visually-hidden static element outside the animated region.
- Respect reduced motion: no animation, no rotation.

## Keys and duplication
- Only one track element at a time; no duplicated lists needed for this discrete-pass design, so no risk of key collisions.
- Still use a stable unique key per pass: `key={`marquee-cycle-${cycle}`}`.

## Validation checklist (tie-in with repo rules)
1. No console warnings/errors (esp. React key collisions).
2. Lint/diagnostics pass.
3. Header, main panel, and footer render correctly at 360/768/1200.
4. No horizontal scrolling at any breakpoint.
5. Reduced motion disables animation and rotation.
6. Colors use theme tokens; no raw hex.

## Implementation outline (React pseudo-code)
```jsx
function FooterMarquee() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [quote, setQuote] = useState(pickRandomQuote());
  const [cycle, setCycle] = useState(0);

  const reduced = useReducedMotion(); // from framer-motion or custom matchMedia; if external dep is not desired, use window.matchMedia

  useEffect(() => {
    if (reduced) return; // static display

    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    // Measure after paint
    const rAF = requestAnimationFrame(() => {
      const distance = container.clientWidth + track.scrollWidth;
      const speed = 80; // px/s; consider exposing via CSS var or prop
      const durationMs = Math.max(8000, Math.round((distance / speed) * 1000));
      track.style.animationDuration = `${durationMs}ms`;
    });

    const onEnd = () => {
      setQuote(pickRandomQuote(quote)); // avoid immediate repeat
      setCycle(c => c + 1); // new key will restart animation
    };
    track.addEventListener('animationend', onEnd);

    return () => {
      cancelAnimationFrame(rAF);
      track.removeEventListener('animationend', onEnd);
    };
  }, [cycle, reduced]);

  return (
    <footer className="panel retro-marquee" role="contentinfo">
      <div ref={containerRef} className="marquee" aria-hidden="true">
        <div ref={trackRef} key={`marquee-cycle-${cycle}`} className="marquee__track">{quote}</div>
      </div>
    </footer>
  );
}
```

`pickRandomQuote(prev)` pulls from `src/assets/quotes.js`, avoiding immediate repeats.

## Testing
- Manual at widths 360/768/1200; verify no x-scroll and smooth motion.
- Toggle reduced motion in OS/browser; ensure static quote appears and no timers run.
- Longest quote still exits fully offscreen left before restart.
- DevTools: confirm no duplicate event listeners in Strict Mode and no console warnings.

## Future enhancements
- Optional: add small pixel-era icons before/after the quote using existing public assets.
- Optional: allow pausing on hover (respecting reduced motion).
- Optional: speed preference persisted to localStorage.
