# Repository Guidelines

## Project Structure & Module Organization

This is a browser-only Vite app using React 18, TypeScript, Tailwind CSS, and Vitest. There is no backend.

- `src/App.tsx` and `src/main.tsx` wire the app together.
- `src/calc/` contains the pure calculation engine: mortgage maths, NZ tax, portfolio assumptions, and simulation logic.
- `src/components/` contains the visible UI, such as inputs, summaries, charts, and cost breakdowns.
- `src/state/` handles URL encoding/decoding so calculator scenarios can be shared as links.
- Tests sit beside the area they cover, for example `src/calc/calc.test.ts` and `src/state/urlState.test.ts`.
- `vite.config.ts` sets the GitHub Pages base path: `/rent-vs-buy-calc/`.

## Build, Test, and Development Commands

- `npm ci` installs exact locked dependencies for clean local or CI setup.
- `npm run dev` starts the local Vite server. Use `/rent-vs-buy-calc/` in the URL for GitHub Pages parity.
- `npm test` runs the Vitest suite once.
- `npm run test:watch` runs tests in watch mode while developing.
- `npm run build` type-checks with `tsc --noEmit` and builds production files into `dist/`.
- `npm run preview` serves the production build locally.

## Coding Style & Naming Conventions

Use TypeScript with strict compiler settings. Follow the existing style: 2-space indentation, single quotes, no semicolons, and named exports for shared helpers. Use `PascalCase` for React components, `camelCase` for functions and variables, and `*Pct` suffixes for percentage inputs stored as whole numbers, such as `5.5` for 5.5%.

Keep calculator logic in `src/calc/` pure and UI-free. Put display formatting in UI or formatting helpers, not the simulation engine.

## Testing Guidelines

Vitest is the test framework. The default test environment is Node, suitable for pure calculation tests. Component tests that need a browser-like environment should add `// @vitest-environment jsdom` at the top, as in `src/App.smoke.test.tsx`.

When changing mortgage, tax, portfolio, or URL behavior, add focused tests. Run `npm test` and `npm run build` before submitting.

## Commit & Pull Request Guidelines

Recent commits use short, action-oriented messages, such as `Add CI workflow...` or `Align calculator with NZ assumptions`. Keep commits focused.

Pull requests should include a summary, tests run, screenshots for UI changes, and notes for changed financial or NZ tax assumptions. Link related issues when available.

## Security & Configuration Tips

Do not commit secrets or local environment files. This static app should not require API keys. Preserve the GitHub Pages base path in `vite.config.ts` unless deployment changes.
