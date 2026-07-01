/**
 * New Zealand tax helpers.
 *
 * The portfolio inputs are PWL's (dividends / capital gains / interest split),
 * but they're taxed under NZ rules:
 *   - Capital gains (realized + unrealized): NOT taxed (NZ has no CGT on a
 *     diversified portfolio held long-term).
 *   - Dividends (domestic + foreign) and interest income: taxed at the
 *     investor's NZ marginal rate.
 *   - Foreign dividends bear foreign withholding tax (FWT). In a taxable account
 *     it's creditable against NZ tax (so the net rate is max(marginal, FWT)); in
 *     a non-taxable account it leaks out with no offsetting domestic tax.
 *   - FIF, PIE/PIR, imputation credits, and bright-line/property-sale tax are
 *     out of scope for this PWL-style version.
 */

export interface TaxBracket {
  upTo: number
  rate: number
}

/** NZ personal income tax brackets from 1 April 2025. */
export const NZ_TAX_BRACKETS: TaxBracket[] = [
  { upTo: 15_600, rate: 0.105 },
  { upTo: 53_500, rate: 0.175 },
  { upTo: 78_100, rate: 0.3 },
  { upTo: 180_000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
]

/** Marginal income tax rate (fraction) for a given gross income. */
export function marginalRate(income: number): number {
  for (const b of NZ_TAX_BRACKETS) {
    if (income <= b.upTo) return b.rate
  }
  return NZ_TAX_BRACKETS[NZ_TAX_BRACKETS.length - 1].rate
}

/** Total annual income tax payable across all bands. */
export function incomeTax(income: number): number {
  let tax = 0
  let lower = 0
  for (const b of NZ_TAX_BRACKETS) {
    if (income <= lower) break
    tax += (Math.min(income, b.upTo) - lower) * b.rate
    lower = b.upTo
  }
  return tax
}

export interface PortfolioTaxInputs {
  isPortfolioTaxable: boolean
  annualIncome: number
  eligibleDividendsPct: number
  foreignDividendsPct: number
  unrealizedGainsPct: number
  realizedGainsPct: number
  interestIncomePct: number
  foreignWithholdingTaxPct: number
  investmentFeePct: number // annual fund/management fee (MER) — a flat drag on the return
}

/** Total expected nominal return (fraction) = sum of the composition fields. */
export function grossPortfolioReturn(p: PortfolioTaxInputs): number {
  return (
    (p.eligibleDividendsPct +
      p.foreignDividendsPct +
      p.unrealizedGainsPct +
      p.realizedGainsPct +
      p.interestIncomePct) /
    100
  )
}

/** Annual tax drag (fraction of portfolio value) under NZ rules. */
export function portfolioTaxDrag(p: PortfolioTaxInputs): number {
  const m = marginalRate(p.annualIncome)
  const f = p.foreignWithholdingTaxPct / 100
  if (p.isPortfolioTaxable) {
    // Dividends + interest taxed at marginal; foreign dividends net of FWT credit
    // (max(m, f) captures any non-creditable excess). Capital gains untaxed.
    const eligible = p.eligibleDividendsPct * m
    const interest = p.interestIncomePct * m
    const foreign = p.foreignDividendsPct * Math.max(m, f)
    return (eligible + interest + foreign) / 100
  }
  // Sheltered account: no domestic tax, but foreign withholding still leaks.
  return (p.foreignDividendsPct * f) / 100
}

/**
 * Expected after-tax, after-fee annual return (fraction) on the portfolio.
 * The management fee (MER) is modelled the way PWL does — a flat drag on the
 * return, applied on top of the NZ tax drag.
 */
export function afterTaxPortfolioReturn(p: PortfolioTaxInputs): number {
  return grossPortfolioReturn(p) - portfolioTaxDrag(p) - (p.investmentFeePct ?? 0) / 100
}
