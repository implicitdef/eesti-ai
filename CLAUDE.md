# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**eesti-ai** is a Vite + React + TypeScript + Tailwind CSS SPA for learning Estonian with AI. It deploys to GitHub Pages at the base path `/eesti-ai/`.

## Development Commands

```bash
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Build: TypeScript check + Vite bundling → dist/
npm run preview          # Preview production build locally
npm run deploy           # Build and deploy to GitHub Pages
npm run pretty           # Format code with Prettier
npm run pretty-check     # Check if code needs formatting (CI)
npm run checktypes       # Typescript check
```

## Architecture

### Technology Stack

- **Vite 6.0** — Build tool with HMR dev server
- **React 19** — UI library with automatic JSX transform
- **TypeScript 5.7** — Strict type checking (noUnusedLocals, noUnusedParameters, etc.)
- **Tailwind CSS 4.0** — Utility-first CSS via @tailwindcss/vite plugin
- **Prettier 3.8** — Code formatting (default config, no custom .prettierrc)

### Entry Points

- `index.html` (root)
- `src/main.tsx` — React app initialization, mounts App to `#root`
- `src/App.tsx` — Main component

### Configuration

- `vite.config.ts` — Sets base to `/eesti-ai/` for GitHub Pages
- `tsconfig.json` — Base config referencing app and build tool configs
- `tsconfig.app.json` — Strict settings for `src/` (ES2020 target)
- `tsconfig.node.json` — Build tool config (ES2022 target)

### Deployment

Built files output to `dist/` directory. GitHub Pages deployment via gh-pages package:

```bash
npm run deploy
```

## TypeScript Settings

- `strict: true` — All strict checks enabled
- `noUnusedLocals: true` — Catch unused variables
- `noUnusedParameters: true` — Catch unused function params
- `noFallthroughCasesInSwitch: true` — Catch missed break statements
- `noUncheckedSideEffectImports: true` — Prevent importing for side effects

## Current Limitations

- No test framework configured (Jest/Vitest)
- No linter configured (ESLint)
- No CI/CD workflows (GitHub Actions)
- Minimal initial content (placeholder chat interface)
