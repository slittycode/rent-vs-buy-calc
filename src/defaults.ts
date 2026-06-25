import type { Inputs } from './types'
import { compositionForAllocation } from './calc/portfolio'

const DEFAULT_PRICE = 850_000
const DEFAULT_ALLOCATION = 80

// At 80% equity this resolves to PWL's default split: 0.60 / 0.75 / 0.43 / 3.85 / 0.67.
const composition = compositionForAllocation(DEFAULT_ALLOCATION)

/** Sensible New Zealand starting scenario. Every value is editable in the UI. */
export const NZ_DEFAULTS: Inputs = {
  location: 'New Zealand',
  isPortfolioTaxable: true,
  timeHorizonYears: 10,
  annualIncome: 90_000,

  purchasePrice: DEFAULT_PRICE,
  downPaymentPct: 20,
  amortizationYears: 30,
  interestRatePct: 5.5,
  propertyTaxRatePct: 0.3,
  propertyTaxIsFixed: false,
  // Matches 0.3% of the default $850k home so switching modes starts level.
  propertyTaxAnnualFixed: 2_550,
  maintenanceCostPct: 1.0,
  maintenanceIsFixed: false,
  // Matches 1.0% of the default $850k home so switching modes starts level.
  maintenanceAnnualFixed: 8_500,
  realEstateGrowthRatePct: 3.5,
  homeInsuranceMonthly: 250,
  purchaseCostsPct: 0.5,
  sellingCostsPct: 3.0,

  rentInsuranceMonthly: 30,
  rentMonthly: Math.round((DEFAULT_PRICE * 0.04) / 12),

  assetAllocationPct: DEFAULT_ALLOCATION,
  inflationPct: 2.5,

  ...composition,
  foreignWithholdingTaxPct: 15,
}
