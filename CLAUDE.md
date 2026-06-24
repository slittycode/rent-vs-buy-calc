# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Rent-vs-Buy calculator localised for **New Zealand** — a faithful clone of [PWL
Capital's tool](https://research-tools.pwlcapital.com/research/rent-vs-buy) that keeps
PWL's input fields/methodology and changes only the **tax treatment** to NZ rules.
Browser-only SPA (Vite + React 18 + TypeScript + Tailwind), no backend. Deploys to
GitHub Pages.

## Commands

```bash
npm install
npm run dev          # http://localhost:5173/rent-vs-buy-calc/  (note the base path)
npm test             # vitest run — calc engine tests + App smoke test
npm run test:watch   # vitest watch
npm run build        # tsc --noEmit (type-check) then vite build → dist/

# Single test file / single test:
npx vitest run src/calc/calc.test.ts
npx vitest run -t "name of the test"
```

## Architecture

The calculation engine is **pure functions** in `src/calc/`, with React (`src/components/`,
`App.tsx`) as a thin UI shell over it. Data flows one way: `Inputs` → `simulate()` →
`SimulationResult` → components.

1. **`src/types.ts`** — the `Inputs` shape, mirroring PWL's fields field-for-field. The
   only localisation is `location` (`'New Zealand'`).
2. **`src/calc/`** — engine:
   - `mortgage.ts` — monthly mortgage payment.
   - `tax.ts` — NZ income-tax brackets, `marginalRate`, and `afterTaxPortfolioReturn`
     (the core NZ-specific logic: capital gains untaxed, dividends/interest at marginal
     rate, foreign-withholding-tax handling that differs by taxable vs sheltered account).
   - `portfolio.ts` — `compositionForAllocation()` maps the equity/bond allocation to the
     five return-composition fields. Calibration constants reproduce PWL's defaults
     exactly at 80% equity.
   - `simulate.ts` — orchestrator. Month-by-month projection of buy-with-mortgage vs
     rent-and-invest-the-difference; returns yearly `series`, final net worths,
     break-even year, and the first-month cost breakdown.
3. **`src/state/urlState.ts`** — `encodeInputs`/`decodeInputs` serialise all inputs to URL
   query params so a scenario is a shareable link. `App.tsx` debounces (250ms) inputs into
   `history.replaceState`; on load it decodes from `window.location.search`.
4. **`src/defaults.ts`** — `NZ_DEFAULTS`, the single source of truth for the default
   scenario. `decodeInputs` falls back to it for any missing/invalid param.
5. **`src/inputLimits.ts`** — per-field min/max; `clampNumericInput` is applied during
   decode (not in the input UI).

## Conventions & gotchas

1. **Vitest default environment is `node`** (set in `vite.config.ts`). Component/render
   tests opt into jsdom per-file with a `// @vitest-environment jsdom` pragma on line 1
   (see `App.smoke.test.tsx`). `src/test/setup.ts` stubs `ResizeObserver` so Recharts can
   render under jsdom.
2. **`base: '/rent-vs-buy-calc/'`** in `vite.config.ts` matches the GitHub Pages project
   path — that's why dev/preview URLs include `/rent-vs-buy-calc/`. Don't remove it.
3. **Percentages are stored as whole numbers** (e.g. `5.5` means 5.5%); the engine divides
   by 100. Dollar amounts are NZD.
4. **Changing `assetAllocationPct` resets the five return-composition fields** — handled in
   `App.tsx`'s `update()` via `compositionForAllocation()`. Preserve this when editing input
   handling.
5. **Adding an input field** means touching, in order: `types.ts` (add to `Inputs`),
   `defaults.ts` (`NZ_DEFAULTS`), `inputLimits.ts` (if numeric), `InputsPanel.tsx` (UI), and
   `simulate.ts`/`tax.ts` if it affects the maths. `urlState` picks up new fields
   automatically by iterating `NZ_DEFAULTS` keys.
6. **NZ tax scope is deliberately simplified** — FIF, PIE/PIR, imputation credits,
   bright-line/property-sale tax, and transaction costs are *not* modelled. The smoke test
   asserts this disclaimer text is present and that Canadian-tool wording is absent.

## Deploy

`.github/workflows/deploy.yml` tests, builds, and publishes to GitHub Pages on push to
`main`; `ci.yml` runs tests/build on PRs. Live at https://slittycode.github.io/rent-vs-buy-calc/
