/**
 * Inputs mirror the PWL Capital rent-vs-buy calculator field-for-field. The only
 * localisation is `location`: a national "New Zealand" default plus the 16 REINZ
 * regions and the Queenstown-Lakes district. Selecting one pre-fills the market-
 * specific fields (price, rent, rates, insurance, growth) — see `regions.ts`. NZ
 * income tax is the same nationwide, so location does not change the tax maths.
 * Percentages are whole numbers (5.5 = 5.5%);
 * dollar amounts are NZD.
 */

export const LOCATIONS = [
  'New Zealand',
  'Northland',
  'Auckland',
  'Waikato',
  'Bay of Plenty',
  'Gisborne',
  "Hawke's Bay",
  'Taranaki',
  'Manawatū-Whanganui',
  'Wellington',
  'Tasman',
  'Nelson',
  'Marlborough',
  'West Coast',
  'Canterbury',
  'Otago',
  'Queenstown-Lakes',
  'Southland',
] as const
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
  maintenanceCostPct: number // annual, % of property value
  realEstateGrowthRatePct: number
  homeInsuranceMonthly: number

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
