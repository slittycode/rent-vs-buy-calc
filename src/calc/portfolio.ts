/**
 * Couples the asset-allocation input to the return-composition fields the same
 * way PWL's tool does: the equity/bond split determines how the expected return
 * breaks down by tax character. The per-asset yields below are calibrated so the
 * default 80% equity allocation reproduces PWL's default composition exactly:
 *   eligible 0.60, foreign 0.75, realized 0.43, unrealized 3.85, interest 0.67.
 */

export const EQUITY_YIELDS = {
  eligibleDividends: 0.75,
  foreignDividends: 0.9375,
  realizedGains: 0.5375,
  unrealizedGains: 4.8125,
} as const

export const BOND_INTEREST_YIELD = 3.35

export interface Composition {
  eligibleDividendsPct: number
  foreignDividendsPct: number
  realizedGainsPct: number
  unrealizedGainsPct: number
  interestIncomePct: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Return composition implied by an equity allocation (rounded for display). */
export function compositionForAllocation(allocationPct: number): Composition {
  const a = Math.min(100, Math.max(0, allocationPct)) / 100
  const bond = 1 - a
  return {
    eligibleDividendsPct: round2(a * EQUITY_YIELDS.eligibleDividends),
    foreignDividendsPct: round2(a * EQUITY_YIELDS.foreignDividends),
    realizedGainsPct: round2(a * EQUITY_YIELDS.realizedGains),
    unrealizedGainsPct: round2(a * EQUITY_YIELDS.unrealizedGains),
    interestIncomePct: round2(bond * BOND_INTEREST_YIELD),
  }
}
