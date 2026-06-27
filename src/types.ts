/**
 * Inputs mirror the PWL Capital rent-vs-buy calculator field-for-field. The only
 * localisation is `location` (New Zealand), which drives NZ income-tax brackets.
 *
 * Percentages are whole numbers (5.5 = 5.5%); dollar amounts are NZD.
 *
 * Several home expenses can be entered either as a **percentage of a base**
 * (e.g. 1% of the home value) or as a **fixed dollar amount**. Each such expense
 * is stored as a `{ value, mode }` pair: `value` is the number the user typed and
 * `mode` says how to read it. The engine resolves the pair to dollars at the point
 * of use (see `src/calc/expenses.ts`). The two modes behave differently over time:
 * a percentage scales with its (growing) base, while a fixed dollar amount escalates
 * with inflation — which is exactly the kind of "what if I model this as a rate vs a
 * fixed cost?" question this tool exists to answer.
 */

export const LOCATIONS = ['New Zealand'] as const
export type Location = (typeof LOCATIONS)[number]

/** How a toggleable expense is interpreted: a percentage of a base, or a fixed dollar amount. */
export const EXPENSE_MODES = ['pct', 'dollar'] as const
export type ExpenseMode = (typeof EXPENSE_MODES)[number]

export interface Inputs {
  // Location & profile
  location: Location
  isPortfolioTaxable: boolean // is the invest-the-difference portfolio in a taxable account?
  timeHorizonYears: number
  annualIncome: number // gross; drives the NZ marginal tax rate

  // Buying — purchase
  purchasePrice: number
  downPayment: number // deposit; read as % of purchase price or as $ per downPaymentMode
  downPaymentMode: ExpenseMode
  amortizationYears: number
  interestRatePct: number
  purchaseCosts: number // one-time upfront buying costs (legal, LIM, building report); % of price or $
  purchaseCostsMode: ExpenseMode
  sellingCosts: number // one-time costs at sale (agent commission, legal); % of sale value or $
  sellingCostsMode: ExpenseMode
  isMainHome: boolean // main home is bright-line exempt; if false, NZ property-sale tax may apply on a sale within 2 years

  // Buying — recurring (annual unless noted)
  propertyTax: number // NZ council rates; % of home value/yr or $/yr
  propertyTaxMode: ExpenseMode
  maintenance: number // upkeep; % of home value/yr or $/yr
  maintenanceMode: ExpenseMode
  homeInsurance: number // % of home value/yr or $/yr
  homeInsuranceMode: ExpenseMode
  otherHomeCostsMonthly: number // body corporate / HOA / other fixed monthly home costs, $/mo
  realEstateGrowthRatePct: number

  // Renting
  rentMonthly: number
  rentInsuranceMonthly: number // contents insurance
  rentGrowthPct: number // annual rent escalation (independent of general inflation)

  // Portfolio (invest the difference)
  assetAllocationPct: number // % equities; remainder bonds/cash
  inflationPct: number
  investmentFeePct: number // annual fund/management fee (MER) dragging the portfolio return

  // Expected annual return, split by tax character (% of portfolio value).
  // The sum is the total expected nominal return; the split sets how it's taxed.
  eligibleDividendsPct: number
  foreignDividendsPct: number
  unrealizedGainsPct: number
  realizedGainsPct: number
  interestIncomePct: number
  foreignWithholdingTaxPct: number
}
