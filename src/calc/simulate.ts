import type { Inputs } from '../types'
import { monthlyMortgagePayment } from './mortgage'
import { afterTaxPortfolioReturn } from './tax'
import { resolveAmount } from './expenses'

/** Net worth (and components) for both parties at one yearly snapshot. */
export interface YearPoint {
  year: number
  homeValue: number
  mortgageBalance: number
  homeEquity: number // homeValue - mortgageBalance
  sellingCost: number // cost to sell the home at this point (agent + legal)
  buyerPortfolio: number // side investments the buyer makes when renting would cost more
  buyerNetWorth: number // home equity − selling cost + side portfolio (value if you sold now)
  renterNetWorth: number // the invested-difference portfolio (after-tax, no NZ exit CGT)
  buyerAnnualCost: number // total buyer cash outflow for that projection year
  renterAnnualCost: number // total renter cash outflow for that projection year
  renterAnnualSavings: number // buyerAnnualCost - renterAnnualCost; positive => renting is cheaper
}

/** First-month cost components, for the year-1 breakdown UI. */
export interface MonthlyCostBreakdown {
  mortgagePayment: number
  propertyTax: number
  maintenance: number
  homeInsurance: number
  otherHomeCosts: number
  buyerTotal: number
  rent: number
  rentInsurance: number
  renterTotal: number
}

export interface SimulationResult {
  series: YearPoint[]
  finalBuyerNetWorth: number
  finalRenterNetWorth: number
  difference: number // buyer - renter at the horizon (positive => buying ahead)
  buyingWins: boolean
  crossoverYear: number | null // first year buying is at least level with renting
  afterTaxReturnPct: number // blended portfolio after-tax, after-fee return used (annual %)
  firstMonth: MonthlyCostBreakdown
  loanAmount: number
  deposit: number // resolved down payment in dollars
  purchaseCostsAmount: number // resolved one-time buying costs in dollars
  sellingCostsAtHorizon: number // resolved selling cost at the final year, in dollars
  monthlyPaymentPI: number // level principal+interest payment
  breakEvenRent: number | null // monthly rent that equalises final net worth (today's $)
}

/** Convert an annual growth fraction to its equivalent monthly rate, guarding against NaN. */
const monthlyRate = (annualFraction: number) => Math.pow(Math.max(1e-9, 1 + annualFraction), 1 / 12) - 1

interface Projection {
  series: YearPoint[]
  firstMonth: MonthlyCostBreakdown
  loanAmount: number
  deposit: number
  purchaseCostsAmount: number
  sellingCostsAtHorizon: number
  monthlyPaymentPI: number
  afterTaxAnnual: number
}

/**
 * Month-by-month projection of buying vs renting-and-investing-the-difference,
 * mirroring PWL's methodology:
 *   - The renter invests, up front, the cash the buyer commits at purchase: the
 *     deposit plus one-time buying costs. So the renter starts ahead by exactly
 *     those buying costs.
 *   - Each month whichever party has the lower housing cost invests the surplus,
 *     and both portfolios compound at the after-tax, after-fee return.
 *   - Recurring home costs (rates, maintenance, insurance) are read either as a
 *     percentage of the home value (so they scale as the home appreciates) or as a
 *     fixed dollar amount (which escalates with inflation), depending on the mode.
 *   - Net worth at any year is the *liquidation* value: home value − selling cost −
 *     mortgage balance + side portfolio, versus the renter's portfolio.
 */
function project(inputs: Inputs): Projection {
  const months = Math.max(1, Math.round(inputs.timeHorizonYears * 12))

  const deposit = Math.min(
    inputs.purchasePrice,
    Math.max(0, resolveAmount(inputs.downPaymentMode, inputs.downPayment, inputs.purchasePrice)),
  )
  const loanAmount = Math.max(0, inputs.purchasePrice - deposit)
  const purchaseCostsAmount = Math.max(
    0,
    resolveAmount(inputs.purchaseCostsMode, inputs.purchaseCosts, inputs.purchasePrice),
  )
  const payment = monthlyMortgagePayment(loanAmount, inputs.interestRatePct, inputs.amortizationYears)
  const mRate = inputs.interestRatePct / 100 / 12

  const afterTaxAnnual = afterTaxPortfolioReturn(inputs)
  const investM = monthlyRate(afterTaxAnnual)
  const inflM = monthlyRate(inputs.inflationPct / 100)
  const rentGrowthM = monthlyRate(inputs.rentGrowthPct / 100)
  const houseGrowthM = monthlyRate(inputs.realEstateGrowthRatePct / 100)

  // Resolve recurring expense to a current monthly dollar amount, by mode.
  const ptPct = inputs.propertyTaxMode === 'pct'
  const mtPct = inputs.maintenanceMode === 'pct'
  const hiPct = inputs.homeInsuranceMode === 'pct'

  let balance = loanAmount
  let homeValue = inputs.purchasePrice
  let rent = inputs.rentMonthly
  let homeIns = inputs.homeInsuranceMonthly
  let rentIns = inputs.rentInsuranceMonthly
  let propTaxFixedM = inputs.propertyTaxAnnualFixed / 12
  let maintFixedM = inputs.maintenanceAnnualFixed / 12
  let inflationIndex = 1 // escalates fixed-dollar costs by inflation over time

  let renterPortfolio = deposit + purchaseCostsAmount // renter invests the buyer's upfront cash
  let buyerPortfolio = 0

  const sellingCostAt = (value: number) =>
    Math.max(
      0,
      inputs.sellingCostsMode === 'pct'
        ? resolveAmount('pct', inputs.sellingCosts, value)
        : inputs.sellingCosts * inflationIndex,
    )

  const buyerNetWorth = () => homeValue - sellingCostAt(homeValue) - balance + buyerPortfolio

  const series: YearPoint[] = [
    {
      year: 0,
      homeValue,
      mortgageBalance: balance,
      homeEquity: homeValue - balance,
      sellingCost: sellingCostAt(homeValue),
      buyerPortfolio,
      buyerNetWorth: buyerNetWorth(),
      renterNetWorth: renterPortfolio,
      buyerAnnualCost: 0,
      renterAnnualCost: 0,
      renterAnnualSavings: 0,
    },
  ]

  let firstMonth: MonthlyCostBreakdown | null = null
  let buyerAnnualCost = 0
  let renterAnnualCost = 0

  for (let m = 1; m <= months; m++) {
    // Buyer mortgage cash outflow for the month.
    let mortgageOutflow = 0
    if (balance > 0) {
      const interest = balance * mRate
      let principalPaid = payment - interest
      if (principalPaid > balance) principalPaid = balance
      mortgageOutflow = interest + principalPaid
      balance -= principalPaid
      if (balance < 0.005) balance = 0
    }

    const propertyTax = inputs.propertyTaxIsFixed
      ? propTaxFixedM
      : (homeValue * (inputs.propertyTaxRatePct / 100)) / 12
    const maintenance = inputs.maintenanceIsFixed
      ? maintFixedM
      : (homeValue * (inputs.maintenanceCostPct / 100)) / 12
    const buyerCost = mortgageOutflow + propertyTax + maintenance + homeIns
    const renterCost = rent + rentIns
    const propertyTax = ptPct
      ? (homeValue * (inputs.propertyTax / 100)) / 12
      : (inputs.propertyTax * inflationIndex) / 12
    const maintenance = mtPct
      ? (homeValue * (inputs.maintenance / 100)) / 12
      : (inputs.maintenance * inflationIndex) / 12
    const homeInsurance = hiPct
      ? (homeValue * (inputs.homeInsurance / 100)) / 12
      : (inputs.homeInsurance * inflationIndex) / 12
    const otherHomeCosts = inputs.otherHomeCostsMonthly * inflationIndex
    const rentInsurance = inputs.rentInsuranceMonthly * inflationIndex

    const buyerCost = mortgageOutflow + propertyTax + maintenance + homeInsurance + otherHomeCosts
    const renterCost = rent + rentInsurance
    buyerAnnualCost += buyerCost
    renterAnnualCost += renterCost

    if (m === 1) {
      firstMonth = {
        mortgagePayment: mortgageOutflow,
        propertyTax,
        maintenance,
        homeInsurance,
        otherHomeCosts,
        buyerTotal: buyerCost,
        rent,
        rentInsurance,
        renterTotal: renterCost,
      }
    }

    // Grow portfolios, then invest the monthly difference (end of month).
    renterPortfolio *= 1 + investM
    buyerPortfolio *= 1 + investM
    const diff = buyerCost - renterCost
    if (diff > 0) renterPortfolio += diff
    else buyerPortfolio += -diff

    // Escalate costs and grow the home for next month.
    homeValue *= 1 + houseGrowthM
    rent *= 1 + inflM
    homeIns *= 1 + inflM
    rentIns *= 1 + inflM
    propTaxFixedM *= 1 + inflM
    maintFixedM *= 1 + inflM
    rent *= 1 + rentGrowthM
    inflationIndex *= 1 + inflM

    if (m % 12 === 0) {
      series.push({
        year: m / 12,
        homeValue,
        mortgageBalance: balance,
        homeEquity: homeValue - balance,
        sellingCost: sellingCostAt(homeValue),
        buyerPortfolio,
        buyerNetWorth: buyerNetWorth(),
        renterNetWorth: renterPortfolio,
        buyerAnnualCost,
        renterAnnualCost,
        renterAnnualSavings: buyerAnnualCost - renterAnnualCost,
      })
      buyerAnnualCost = 0
      renterAnnualCost = 0
    }
  }

  const last = series[series.length - 1]

  return {
    series,
    firstMonth: firstMonth!,
    loanAmount,
    deposit,
    purchaseCostsAmount,
    sellingCostsAtHorizon: last.sellingCost,
    monthlyPaymentPI: payment,
    afterTaxAnnual,
  }
}

/**
 * The monthly rent (in today's dollars) at which the two paths end with the same
 * net worth — the "indifference rent". Net worth difference (buyer − renter) is
 * increasing in rent, so we bracket a sign change and bisect. Returns null when no
 * crossover exists in a sensible range (e.g. buying never catches up).
 */
function solveBreakEvenRent(inputs: Inputs): number | null {
  const diffAtRent = (rentMonthly: number) => {
    const p = project({ ...inputs, rentMonthly })
    const last = p.series[p.series.length - 1]
    return last.buyerNetWorth - last.renterNetWorth
  }

  const f0 = diffAtRent(0)
  if (f0 === 0) return 0
  if (f0 > 0) return null // buying already wins at zero rent — no positive break-even rent

  let hi = Math.max(inputs.rentMonthly, 500)
  let fhi = diffAtRent(hi)
  let guard = 0
  while (fhi < 0 && guard < 40) {
    hi *= 2
    fhi = diffAtRent(hi)
    guard++
  }
  if (fhi < 0) return null // no sign change found within range

  let lo = 0
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (diffAtRent(mid) < 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function simulate(inputs: Inputs): SimulationResult {
  const core = project(inputs)
  const { series } = core
  const last = series[series.length - 1]
  const crossover = series.find((p) => p.year > 0 && p.buyerNetWorth >= p.renterNetWorth)

  return {
    series,
    finalBuyerNetWorth: last.buyerNetWorth,
    finalRenterNetWorth: last.renterNetWorth,
    difference: last.buyerNetWorth - last.renterNetWorth,
    buyingWins: last.buyerNetWorth >= last.renterNetWorth,
    crossoverYear: crossover ? crossover.year : null,
    afterTaxReturnPct: core.afterTaxAnnual * 100,
    firstMonth: core.firstMonth,
    loanAmount: core.loanAmount,
    deposit: core.deposit,
    purchaseCostsAmount: core.purchaseCostsAmount,
    sellingCostsAtHorizon: core.sellingCostsAtHorizon,
    monthlyPaymentPI: core.monthlyPaymentPI,
    breakEvenRent: solveBreakEvenRent(inputs),
  }
}
