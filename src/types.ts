/**
 * All user-configurable inputs for the NZ rent-vs-buy comparison.
 * Percentages are stored as whole numbers (e.g. 5.5 means 5.5%).
 * Dollar amounts are in NZD.
 */
export interface Inputs {
  // Horizon & personal
  timeHorizonYears: number
  annualIncome: number // gross, drives marginal rate / suggested PIR

  // Buying
  purchasePrice: number
  depositPct: number // % of purchase price paid upfront
  loanTermYears: number // mortgage amortisation period
  mortgageRatePct: number // annual interest rate
  councilRatesPct: number // annual, as % of property value (NZ "rates")
  maintenancePct: number // annual, as % of property value
  houseGrowthPct: number // annual house-price appreciation
  houseInsuranceMonthly: number
  bodyCorporateMonthly: number // apartments/units; 0 for standalone houses
  purchaseCosts: number // upfront legal + building inspection (no stamp duty in NZ)
  sellingCostsPct: number // agent commission + legal, applied on sale value

  // Renting
  rentMonthly: number
  rentGrowthPct: number // annual rent increases
  contentsInsuranceMonthly: number

  // Investing the difference
  equityAllocationPct: number // % equities; remainder is bonds/cash
  equityReturnPct: number // expected nominal annual equity return
  bondReturnPct: number // expected nominal annual bond/cash return
  pirPct: number // Prescribed Investor Rate for the FIF/PIE portfolio

  // Economy
  inflationPct: number // escalates insurance / body corp (and default rent growth)
}
