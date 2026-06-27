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
  downPayment: 20,
  downPaymentMode: 'pct',
  amortizationYears: 30,
  interestRatePct: 5.5,
  // NZ has no stamp duty; buying costs are mainly legal + LIM + building report.
  purchaseCosts: 2_500,
  purchaseCostsMode: 'dollar',
  // Agent commission (~2.5–4%) plus legal, as a share of the sale price.
  sellingCosts: 2.9,
  sellingCostsMode: 'pct',
  isMainHome: true,

  propertyTax: 0.3,
  propertyTaxMode: 'pct',
  maintenance: 1.0,
  maintenanceMode: 'pct',
  homeInsurance: 3_000,
  homeInsuranceMode: 'dollar',
  otherHomeCostsMonthly: 0,
  realEstateGrowthRatePct: 3.5,

  rentMonthly: Math.round((DEFAULT_PRICE * 0.04) / 12),
  rentInsuranceMonthly: 30,
  rentGrowthPct: 3.0,

  assetAllocationPct: DEFAULT_ALLOCATION,
  inflationPct: 2.5,
  investmentFeePct: 0.25,

  ...composition,
  foreignWithholdingTaxPct: 15,
}
