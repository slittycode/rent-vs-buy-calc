import type { Inputs } from './types'

export type NumericInputKey = { [K in keyof Inputs]: Inputs[K] extends number ? K : never }[keyof Inputs]

export type BooleanInputKey = { [K in keyof Inputs]: Inputs[K] extends boolean ? K : never }[keyof Inputs]

export interface NumericInputLimit {
  min?: number
  max?: number
}

export const NUMERIC_INPUT_LIMITS: Record<NumericInputKey, NumericInputLimit> = {
  timeHorizonYears: { min: 1, max: 50 },
  annualIncome: { min: 0 },

  purchasePrice: { min: 0 },
  downPaymentPct: { min: 0, max: 100 },
  amortizationYears: { min: 1, max: 40 },
  interestRatePct: { min: 0 },
  propertyTaxRatePct: { min: 0 },
  propertyTaxAnnualFixed: { min: 0 },
  maintenanceCostPct: { min: 0 },
  maintenanceAnnualFixed: { min: 0 },
  realEstateGrowthRatePct: {},
  homeInsuranceMonthly: { min: 0 },
  purchaseCostsPct: { min: 0, max: 100 },
  sellingCostsPct: { min: 0, max: 100 },

  rentInsuranceMonthly: { min: 0 },
  rentMonthly: { min: 0 },

  assetAllocationPct: { min: 0, max: 100 },
  inflationPct: {},

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
