import type { Inputs } from './types'

export type NumericInputKey = { [K in keyof Inputs]: Inputs[K] extends number ? K : never }[keyof Inputs]
export type BooleanInputKey = { [K in keyof Inputs]: Inputs[K] extends boolean ? K : never }[keyof Inputs]

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
  timeHorizonYears: { min: 1, max: 50 },
  annualIncome: { min: 0 },

  purchasePrice: { min: 0 },
  downPayment: { min: 0 },
  amortizationYears: { min: 1, max: 40 },
  interestRatePct: { min: 0 },
  propertyTaxRatePct: { min: 0 },
  propertyTaxAnnualFixed: { min: 0 },
  maintenanceCostPct: { min: 0 },
  maintenanceAnnualFixed: { min: 0 },
  purchaseCosts: { min: 0 },
  sellingCosts: { min: 0 },

  propertyTax: { min: 0 },
  maintenance: { min: 0 },
  homeInsurance: { min: 0 },
  otherHomeCostsMonthly: { min: 0 },
  realEstateGrowthRatePct: {},

  rentMonthly: { min: 0 },
  rentInsuranceMonthly: { min: 0 },
  rentGrowthPct: {},

  assetAllocationPct: { min: 0, max: 100 },
  inflationPct: {},
  investmentFeePct: { min: 0, max: 100 },

  eligibleDividendsPct: { min: 0 },
  foreignDividendsPct: { min: 0 },
  unrealizedGainsPct: { min: 0 },
  realizedGainsPct: { min: 0 },
  interestIncomePct: { min: 0 },
  foreignWithholdingTaxPct: { min: 0, max: 100 },
}

export function clampNumericInput<K extends NumericInputKey>(key: K, value: number): number {
  const { min, max } = NUMERIC_INPUT_LIMITS[key]
  if (min !== undefined && value < min) return min
  if (max !== undefined && value > max) return max
  return value
}
