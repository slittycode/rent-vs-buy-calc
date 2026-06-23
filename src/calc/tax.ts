/**
 * New Zealand tax helpers.
 *
 * Investment portfolio (the "rent and invest the difference" side) is modelled
 * the NZ way:
 *   - Equities are assumed to be a global/foreign PIE fund taxed under the
 *     Foreign Investment Fund (FIF) Fair Dividend Rate (FDR) method: 5% of the
 *     portfolio value is deemed taxable income each year, taxed at the investor's
 *     PIR. The drag is therefore a fixed 0.05 * PIR of value per year (1.40% at
 *     the 28% PIR), regardless of the actual return.
 *   - Bonds/cash income is taxed at the PIR.
 *   - There is NO capital gains tax and NO exit tax, so the final portfolio value
 *     IS the after-tax net worth (a key contrast with the Canadian original).
 */

export interface TaxBracket {
  /** Upper bound of this band (inclusive); Infinity for the top band. */
  upTo: number
  rate: number
}

/** 2025/26 NZ personal income tax brackets (effective from 1 April 2025). */
export const NZ_TAX_BRACKETS: TaxBracket[] = [
  { upTo: 15_600, rate: 0.105 },
  { upTo: 53_500, rate: 0.175 },
  { upTo: 78_100, rate: 0.3 },
  { upTo: 180_000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
]

/** Marginal income tax rate (as a fraction, e.g. 0.33) for a given gross income. */
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
    const taxedHere = Math.min(income, b.upTo) - lower
    tax += taxedHere * b.rate
    lower = b.upTo
  }
  return tax
}

export interface ReturnAssumptions {
  equityAllocationPct: number
  equityReturnPct: number
  bondReturnPct: number
  pirPct: number
}

/** Fixed annual FIF/FDR tax drag on the equity portion (fraction of value). */
export function fdrDrag(pirPct: number): number {
  return 0.05 * (pirPct / 100)
}

/**
 * Blended expected after-tax annual return on the portfolio (as a fraction).
 * Equities: gross return minus the fixed FDR drag.
 * Bonds/cash: gross interest taxed at the PIR.
 */
export function afterTaxAnnualReturn(a: ReturnAssumptions): number {
  const equity = a.equityAllocationPct / 100
  const bond = 1 - equity
  const pir = a.pirPct / 100
  const equityAfterTax = a.equityReturnPct / 100 - fdrDrag(a.pirPct)
  const bondAfterTax = (a.bondReturnPct / 100) * (1 - pir)
  return equity * equityAfterTax + bond * bondAfterTax
}
