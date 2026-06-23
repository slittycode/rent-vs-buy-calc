# Rent vs Buy — New Zealand 🇳🇿

A rent-vs-buy calculator localised for New Zealand. It compares **buying a home**
against **renting and investing the difference**, projecting both paths month by
month and showing which leaves you with more net worth — with NZ tax built in.

It's modelled on [PWL Capital's Rent vs Buy tool](https://research-tools.pwlcapital.com/research/rent-vs-buy)
(the Canadian one behind Ben Felix's "5% rule"), re-worked for NZ rules:

- **No capital gains tax on your main home** — home growth is kept in full.
- **No stamp duty** — purchase costs are just legal fees + a building inspection.
- **Council rates** instead of property tax.
- **NZ investment tax** on the "invest the difference" portfolio: foreign/global
  equities are treated as a **PIE fund under the Foreign Investment Fund (FIF)
  Fair Dividend Rate (FDR)** method — 5% of value is deemed taxable each year at
  your **PIR** (capped at 28%), a fixed ~1.4% drag at the top rate — and there's
  **no exit/capital-gains tax**, so the final portfolio value is already after-tax.

> ⚠️ Educational tool, **not financial advice**. Tax rules are simplified — check
> with a professional before making a decision.

## How the comparison works

Both paths are simulated month by month over your chosen horizon. **Net worth in
any year is what you'd walk away with if you cashed out then:**

- **Buyer:** home value − selling costs − remaining mortgage, plus any side
  investments. Pays the deposit + purchase costs up front, then mortgage P&I +
  council rates + maintenance + insurance (+ optional body corporate) each month.
- **Renter:** the value of an investment portfolio (already after-tax). Invests
  the deposit + purchase costs the buyer tied up at the start, then each month
  whichever side has the lower housing cost invests the surplus — so both paths
  use the same money.

The result shows the headline verdict, the **break-even year**, a **net-worth-over-time
chart**, and a first-month cost breakdown. Every assumption is editable, and your
scenario is encoded in the URL so you can **share it as a link**.

### Default tax assumptions (2025/26)

- NZ personal income tax brackets: 10.5% / 17.5% / 30% / 33% / 39% at
  $15,600 / $53,500 / $78,100 / $180,000.
- Equity portfolio: FIF Fair Dividend Rate (5% of value) × PIR.
- Bonds/cash: interest taxed at PIR.

All figures are in today's **nominal** dollars, and a single fixed mortgage rate
is assumed for the whole term.

## Develop locally

```bash
npm install
npm run dev      # http://localhost:5173/rent-vs-buy-calc/
npm test         # unit tests (calc engine) + an app render smoke test
npm run build    # type-check + production build to dist/
```

> Note: the dev/preview URL includes the `/rent-vs-buy-calc/` path because that's
> the GitHub Pages base path (see `vite.config.ts`).

### Project layout

```
src/
  calc/        mortgage maths, NZ tax (FDR/PIR), and the month-by-month simulation
  components/  inputs panel, results summary, net-worth chart, cost breakdown
  state/       encode/decode inputs ↔ URL query params
  defaults.ts  NZ default scenario
  types.ts     the Inputs shape
```

The calculation engine is pure functions in `src/calc/`, covered by unit tests in
`src/calc/calc.test.ts`.

## Deploy (GitHub Pages)

Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
on every push to `main` it runs the tests, builds, and publishes to GitHub Pages.

**One-time setup:** in the repo, go to **Settings → Pages → Build and deployment →
Source: GitHub Actions**. After the next push to `main`, the site is live at:

```
https://slittycode.github.io/rent-vs-buy-calc/
```

You can also trigger a deploy manually from the **Actions** tab (workflow_dispatch).
