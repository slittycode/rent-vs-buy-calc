import type { Inputs } from './types'
import { compositionForAllocation } from './calc/portfolio'
import { presetForLocation } from './regions'

const DEFAULT_ALLOCATION = 80

// At 80% equity this resolves to PWL's default split: 0.60 / 0.75 / 0.43 / 3.85 / 0.67.
const composition = compositionForAllocation(DEFAULT_ALLOCATION)

/**
 * Sensible New Zealand starting scenario. Every value is editable in the UI. The
 * market-specific fields (price, rent, rates, insurance, growth) come from the
 * national preset in `regions.ts`, so the location dropdown and the defaults stay
 * in sync.
 */
export const NZ_DEFAULTS: Inputs = {
  location: 'New Zealand',
  isPortfolioTaxable: true,
  timeHorizonYears: 10,
  annualIncome: 90_000,

  downPayment: 20,
  downPaymentMode: 'pct',
  amortizationYears: 30,
  interestRatePct: 5.5,
  propertyTaxIsFixed: false,
  // Matches 0.3% of the default $850k home so switching modes starts level.
  propertyTaxAnnualFixed: 2_550,
  maintenanceCostPct: 1.0,
  maintenanceIsFixed: false,
  // Matches 1.0% of the default $850k home so switching modes starts level.
  maintenanceAnnualFixed: 8_500,
  // NZ has no stamp duty; buying costs are mainly legal + LIM + building report.
  purchaseCosts: 2_500,
  purchaseCostsMode: 'dollar',
  // Agent commission (~2.5–4%) plus legal, as a share of the sale price.
  sellingCosts: 2.9,
  sellingCostsMode: 'pct',

  propertyTaxMode: 'pct',
  maintenance: 1.0,
  maintenanceMode: 'pct',
  homeInsuranceMode: 'dollar',
  otherHomeCostsMonthly: 0,

  rentInsuranceMonthly: 30,
  rentGrowthPct: 3.0,

  assetAllocationPct: DEFAULT_ALLOCATION,
  inflationPct: 2.5,
  investmentFeePct: 0.25,

  ...composition,
  foreignWithholdingTaxPct: 15,

  // Market-specific fields come last so the national preset is the single source of truth.
  ...presetForLocation('New Zealand'),
}
