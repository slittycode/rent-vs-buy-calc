import type { Inputs } from './types'

export type NumericInputKey = { [K in keyof Inputs]: Inputs[K] extends number ? K : never }[keyof Inputs]
export interface NumericInputLimit {
  min?: number
  max?: number
}

/**
 * Static per-field bounds applied when decoding a shared URL. Toggleable expenses
 * (down payment, property tax, maintenance, insurance, purchase/selling costs) keep
 * loose bounds here because their sensible maximum depends on the current mode
 * (a percentage caps near 100; a dollar amount does not). The UI applies the
 * mode-aware cap via `toggleFieldLimit`.
 */
export const NUMERIC_INPUT_LIMITS: Record<NumericInputKey, NumericInputLimit> = {
  timeHorizonYears: { min: 0, max: 100 },
  annualIncome: { min: 0, max: 1_000_000 },

  purchasePrice: { min: 0, max: 5_000_000 },
  downPayment: { min: 0 },
  amortizationYears: { min: 1, max: 40 },
  interestRatePct: { min: 0, max: 10 },
  purchaseCosts: { min: 0 },
  sellingCosts: { min: 0 },

  propertyTax: { min: 0 },
  maintenance: { min: 0 },
  homeInsurance: { min: 0 },
  otherHomeCostsMonthly: { min: 0, max: 10_000 },
  realEstateGrowthRatePct: { min: -100, max: 10 },

  rentMonthly: { min: 0, max: 10_000 },
  rentInsuranceMonthly: { min: 0, max: 10_000 },
  rentGrowthPct: { min: -100, max: 10 },

  assetAllocationPct: { min: 0, max: 100 },
  inflationPct: { min: -100, max: 10 },
  investmentFeePct: { min: 0, max: 100 },

  eligibleDividendsPct: { min: 0, max: 10 },
  foreignDividendsPct: { min: 0, max: 10 },
  unrealizedGainsPct: { min: 0, max: 10 },
  realizedGainsPct: { min: 0, max: 10 },
  interestIncomePct: { min: 0, max: 10 },
  foreignWithholdingTaxPct: { min: 0, max: 100 },
}

export function clampNumericInput<K extends NumericInputKey>(key: K, value: number): number {
  const { min, max } = NUMERIC_INPUT_LIMITS[key]
  if (min !== undefined && value < min) return min
  if (max !== undefined && value > max) return max
  return value
}
