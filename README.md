# Rent vs Buy — New Zealand 🇳🇿

A near-exact clone of [PWL Capital's Rent vs Buy calculator](https://research-tools.pwlcapital.com/research/rent-vs-buy)
(the Canadian tool behind Ben Felix's "5% rule"), localised for **New Zealand**.

It keeps PWL's input fields and methodology unchanged — the **location** is New Zealand,
which drives **NZ income-tax rates** and **NZ investment-tax treatment**.

> ⚠️ Educational tool, **not financial advice**. Tax rules are simplified — check
> with a professional before deciding.

## Goals

- Keep the polished PWL Capital rent-vs-buy calculator approach, but make it
  useful for New Zealand users instead of Canadian users.
- Compare the two main choices in plain terms: **buy a home with a mortgage** or
  **rent and invest the money that would otherwise go into buying**.
- Use New Zealand tax assumptions where they matter most, especially income tax
  on dividends and interest, while clearly naming the NZ tax details that are not
  modelled yet.
- Keep the calculator transparent: show the headline result, break-even year,
  net-worth chart, and first-month cost breakdown so users can see why a result
  changed.
- Make scenarios easy to share by encoding every input in the URL.
- Stay browser-only and simple to run, with no backend, accounts, API keys, or
  stored personal data.

## What it does

It projects two paths month by month over your time horizon — **buy with a
mortgage** vs **rent and invest the difference** — and compares net worth:

- **Renter** invests the down payment up front, then each month whichever side has
  the lower housing cost invests the surplus.
- **Net worth** = home value − mortgage balance + any side investments, versus the
  renter's portfolio.

Outputs: the headline verdict, the break-even year, a net-worth-over-time chart, and
a first-month cost breakdown. Every input is encoded in the URL, so a scenario is a
**shareable link**.

### The one localised difference: tax

PWL's portfolio inputs (return split into NZ/foreign dividends, realised/
unrealised capital gains, and interest income, plus a foreign-withholding-tax rate)
are kept exactly — but taxed under **NZ rules**:

- **Capital gains are not taxed** (no NZ CGT on a long-term diversified portfolio).
- **Dividends and interest** are taxed at your **NZ marginal rate** (from 1 April 2025
  brackets: 10.5% / 17.5% / 30% / 33% / 39%).
- **Foreign withholding tax** applies to foreign dividends (creditable in a taxable
  account; a pure leak in a sheltered one).
- No exit/capital-gains tax, so the final portfolio value is already after-tax.
- This first version assumes a main-home buyer, not an investment-property
  landlord.
- FIF rules, PIE/PIR tax treatment, dividend imputation credits,
  bright-line/property-sale tax, and transaction costs are not modelled.

The **asset allocation** input sets the equity/bond split and resets the return-mix
fields accordingly (at 80% equity they match PWL's defaults exactly); you can then
fine-tune any row.

## Develop locally

```bash
npm install
npm run dev      # http://localhost:5173/rent-vs-buy-calc/
npm test         # unit tests (calc engine) + an app render smoke test
npm run build    # type-check + production build to dist/
```

> The dev/preview URL includes `/rent-vs-buy-calc/` because that's the GitHub Pages
> base path (see `vite.config.ts`).

### Project layout

```
src/
  calc/        mortgage maths, NZ tax, asset-allocation → return composition, simulation
  components/  inputs panel, results summary, net-worth chart, cost breakdown
  state/       encode/decode inputs ↔ URL query params
  defaults.ts  NZ default scenario
  types.ts     the Inputs shape (mirrors PWL's fields)
```

The calculation engine is pure functions in `src/calc/`, covered by tests in
`src/calc/calc.test.ts`.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` runs the tests, builds, and publishes to GitHub Pages
on every push to `main`. One-time setup: **Settings → Pages → Source: GitHub Actions**.
The site is then live at:

```
https://slittycode.github.io/rent-vs-buy-calc/
```

You can also trigger a deploy manually from the **Actions** tab.
