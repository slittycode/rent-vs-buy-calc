/**
 * Inputs mirror the PWL Capital rent-vs-buy calculator field-for-field. The only
 * localisation is `location` (New Zealand), which drives NZ income-tax brackets.
 * Percentages are whole numbers (5.5 = 5.5%);
 * dollar amounts are NZD.
 */

export const LOCATIONS = ['New Zealand'] as const
export type Location = (typeof LOCATIONS)[number]

export interface Inputs {
  // Location & profile
  location: Location
  isPortfolioTaxable: boolean // is the invest-the-difference portfolio in a taxable account?
  timeHorizonYears: number
  annualIncome: number // gross; drives the NZ marginal tax rate

  // Buying
  purchasePrice: number
  downPaymentPct: number
  amortizationYears: number
  interestRatePct: number
  propertyTaxRatePct: number // annual, % of property value (NZ: council rates)
  propertyTaxIsFixed: boolean // true => use propertyTaxAnnualFixed instead of the % of value
  propertyTaxAnnualFixed: number // annual $ council rates when fixed; grows with inflation
  maintenanceCostPct: number // annual, % of property value
  maintenanceIsFixed: boolean // true => use maintenanceAnnualFixed instead of the % of value
  maintenanceAnnualFixed: number // annual $ maintenance when fixed; grows with inflation
  realEstateGrowthRatePct: number
  homeInsuranceMonthly: number
  purchaseCostsPct: number // one-off buying costs (legal, LIM, builder's report) as % of price; no NZ stamp duty
  sellingCostsPct: number // one-off costs to sell (agent commission + legal) as % of the sale value

  // Renting
  rentInsuranceMonthly: number
  rentMonthly: number

  // Portfolio (invest the difference)
  assetAllocationPct: number // % equities; remainder bonds/cash
  inflationPct: number

  // Expected annual return, split by tax character (% of portfolio value).
  // The sum is the total expected nominal return; the split sets how it's taxed.
  eligibleDividendsPct: number
  foreignDividendsPct: number
  unrealizedGainsPct: number
  realizedGainsPct: number
  interestIncomePct: number
  foreignWithholdingTaxPct: number
}
