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

  downPaymentPct: 20,
  amortizationYears: 30,
  interestRatePct: 5.5,
  maintenanceCostPct: 1.0,

  rentInsuranceMonthly: 30,

  assetAllocationPct: DEFAULT_ALLOCATION,
  inflationPct: 2.5,

  ...composition,
  foreignWithholdingTaxPct: 15,

  ...presetForLocation('New Zealand'),
}
