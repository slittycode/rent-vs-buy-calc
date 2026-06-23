import type { Inputs } from './types'

const DEFAULT_PRICE = 850_000
const DEFAULT_GROSS_YIELD = 0.04 // ~4% gross rental yield to seed a sensible default rent

/**
 * Sensible New Zealand defaults (mid-2026). Every value is editable in the UI;
 * these just give a realistic starting scenario.
 */
export const NZ_DEFAULTS: Inputs = {
  timeHorizonYears: 10,
  annualIncome: 90_000,

  purchasePrice: DEFAULT_PRICE,
  depositPct: 20,
  loanTermYears: 30,
  mortgageRatePct: 5.5,
  councilRatesPct: 0.3,
  maintenancePct: 1.0,
  houseGrowthPct: 3.5,
  houseInsuranceMonthly: 250,
  bodyCorporateMonthly: 0,
  purchaseCosts: 2_500,
  sellingCostsPct: 2.8,

  rentMonthly: Math.round((DEFAULT_PRICE * DEFAULT_GROSS_YIELD) / 12),
  rentGrowthPct: 2.5,
  contentsInsuranceMonthly: 30,

  equityAllocationPct: 80,
  equityReturnPct: 6.5,
  bondReturnPct: 4.0,
  pirPct: 28,

  inflationPct: 2.5,
}
