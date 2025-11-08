# rosematcha Portfolio

Personal portfolio site for Reese Ferguson - developer, photographer, and organizer.

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run tests
npm run validate     # Run all checks + tests
```

## Tech Stack

- React 19 + Vite 6
- React Router DOM v7
- Lucide React icons
- Vitest + Testing Library

## Code Quality & Testing

**Configuration:** Consolidated into `package.json` (Prettier, Stylelint) and `.eslintrc.cjs` (ESLint)

```bash
# Linting
npm run lint         # Check JavaScript/JSX  
npm run lint:fix     # Auto-fix JavaScript/JSX
npm run lint:css     # Check CSS
npm run lint:css:fix # Auto-fix CSS  

# Formatting
npm run format       # Format all code
npm run format:check # Check formatting

# Testing
npm test             # Run tests in watch mode
npm run test:ui      # Open Vitest UI
npm run test:coverage # Generate coverage report

# All checks
npm run validate     # Lint + format + tests
```

### What's Enforced

**JavaScript/JSX (ESLint - 120+ rules):**
- Modern ES6+ syntax enforcement
- React best practices & hooks rules
- **Complete WCAG 2.1 AA accessibility compliance**
- Bug prevention (async issues, infinite loops, unreachable code)
- Import organization & circular dependency detection

**CSS (Stylelint):**
- Alphabetical property ordering
- Modern color notation
- No invalid/deprecated syntax

**Tests (Vitest + Testing Library):**
- 43 tests covering utils and components
- Component behavior testing
- Image loading optimization tests
- Prefetch utility tests

**Pre-commit hooks** automatically lint, format, and test staged files.

### Quality Guarantees

✅ No accessibility violations  
✅ No runtime bugs from common mistakes  
✅ No circular dependencies  
✅ Consistent code style  
✅ 43 passing tests  
✅ Optimal React patterns

## Project Structure

```
src/
├── assets/          # Static assets
├── components/      # React components + tests
├── data/            # Data files
├── pages/           # Route pages
├── test/            # Test setup
└── utils/           # Utilities + tests
```

## Deploy

Builds to `../_site` for Cloudflare deployment.

---

**Contact:** hi@rosematcha.com
