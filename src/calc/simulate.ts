import type { Inputs } from '../types'
import { monthlyMortgagePayment } from './mortgage'
import { afterTaxPortfolioReturn } from './tax'
import { resolveAmount } from './expenses'

/** Net worth (and components) for both parties at one yearly or partial-year snapshot. */
export interface YearPoint {
  year: number
  periodMonths: number // months covered by the cash-flow fields at this point
  homeValue: number
  mortgageBalance: number
  homeEquity: number // homeValue - mortgageBalance
  sellingCost: number // cost to sell the home at this point (agent + legal)
  buyerPortfolio: number // side investments the buyer makes when renting would cost more
  buyerNetWorth: number // home equity - selling cost + side portfolio (value if you sold now)
  renterNetWorth: number // the invested-difference portfolio (after-tax, no NZ exit CGT)
  buyerAnnualCost: number // total buyer cash outflow for this point's period
  renterAnnualCost: number // total renter cash outflow for this point's period
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
  horizonYears: number // actual projection horizon after rounding to whole months
  finalBuyerNetWorth: number
  finalRenterNetWorth: number
  difference: number // buyer - renter at the horizon (positive => buying ahead)
  buyingWins: boolean
  crossoverYear: number | null // first monthly point where buying is at least level with renting
  mortgagePaidOffYear: number | null // first monthly point where the mortgage balance reaches zero
  afterTaxReturnPct: number // blended portfolio after-tax, after-fee return used (annual %)
  firstMonth: MonthlyCostBreakdown
  loanAmount: number
  deposit: number // resolved down payment in dollars
  purchaseCostsAmount: number // resolved one-time buying costs in dollars
  sellingCostsAtHorizon: number // resolved selling cost at the final year, in dollars
  monthlyPaymentPI: number // level principal+interest payment
  breakEvenRent: number | null // monthly rent that equalises final net worth (today's $)
}

/** Convert an annual growth fraction to its equivalent monthly rate. */
const monthlyRate = (annualFraction: number) => {
  const boundedAnnualFraction = Math.max(-1, annualFraction)
  if (boundedAnnualFraction === -1) return -1
  return Math.pow(1 + boundedAnnualFraction, 1 / 12) - 1
}

interface Projection {
  series: YearPoint[]
  firstMonth: MonthlyCostBreakdown
  loanAmount: number
  deposit: number
  purchaseCostsAmount: number
  sellingCostsAtHorizon: number
  monthlyPaymentPI: number
  afterTaxAnnual: number
  crossoverYear: number | null
  mortgagePaidOffYear: number | null
}

/**
 * Month-by-month projection of buying vs renting-and-investing-the-difference,
 * mirroring PWL's methodology:
 *   - The renter invests, up front, the cash the buyer commits at purchase: the
 *     deposit plus one-time buying costs.
 *   - Each month whichever party has the lower housing cost invests the surplus,
 *     and both portfolios compound at the after-tax, after-fee return.
 *   - Recurring home costs (rates, maintenance, insurance) are read either as a
 *     percentage of the home value or as a fixed dollar amount that escalates with
 *     inflation.
 *   - Net worth at any point is the liquidation value: home value - selling cost -
 *     mortgage balance + side portfolio, versus the renter's portfolio.
 */
function project(inputs: Inputs): Projection {
  const months = Math.max(0, Math.round(inputs.timeHorizonYears * 12))

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

  const ptPct = inputs.propertyTaxMode === 'pct'
  const mtPct = inputs.maintenanceMode === 'pct'
  const hiPct = inputs.homeInsuranceMode === 'pct'

  let balance = loanAmount
  let homeValue = inputs.purchasePrice
  let rent = inputs.rentMonthly
  let inflationIndex = 1
  let renterPortfolio = deposit + purchaseCostsAmount
  let buyerPortfolio = 0

  const sellingCostAt = (value: number) =>
    Math.max(
      0,
      inputs.sellingCostsMode === 'pct'
        ? resolveAmount('pct', inputs.sellingCosts, value)
        : inputs.sellingCosts * inflationIndex,
    )

  const buyerNetWorth = () => homeValue - sellingCostAt(homeValue) - balance + buyerPortfolio

  const monthlyCostBreakdown = (mortgageOutflow: number): MonthlyCostBreakdown => {
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

    return {
      mortgagePayment: mortgageOutflow,
      propertyTax,
      maintenance,
      homeInsurance,
      otherHomeCosts,
      buyerTotal: mortgageOutflow + propertyTax + maintenance + homeInsurance + otherHomeCosts,
      rent,
      rentInsurance,
      renterTotal: rent + rentInsurance,
    }
  }

  const initialMortgageOutflow = (() => {
    if (loanAmount <= 0) return 0
    const interest = loanAmount * mRate
    const principalPaid = Math.min(payment - interest, loanAmount)
    return interest + principalPaid
  })()
  const firstMonth = monthlyCostBreakdown(initialMortgageOutflow)

  let buyerAnnualCost = 0
  let renterAnnualCost = 0

  const snapshot = (year: number, periodMonths: number): YearPoint => ({
    year,
    periodMonths,
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

  const series: YearPoint[] = [snapshot(0, 0)]
  let crossoverYear: number | null = series[0].buyerNetWorth >= series[0].renterNetWorth ? 0 : null
  let mortgagePaidOffYear: number | null = null

  for (let m = 1; m <= months; m++) {
    let mortgageOutflow = 0
    if (balance > 0) {
      const interest = balance * mRate
      let principalPaid = payment - interest
      if (principalPaid > balance) principalPaid = balance
      mortgageOutflow = interest + principalPaid
      balance -= principalPaid
      if (balance < 0.005) balance = 0
      if (mortgagePaidOffYear === null && balance === 0) {
        mortgagePaidOffYear = m / 12
      }
    }

    const costs = monthlyCostBreakdown(mortgageOutflow)
    buyerAnnualCost += costs.buyerTotal
    renterAnnualCost += costs.renterTotal

    renterPortfolio *= 1 + investM
    buyerPortfolio *= 1 + investM
    const diff = costs.buyerTotal - costs.renterTotal
    if (diff > 0) renterPortfolio += diff
    else buyerPortfolio += -diff

    homeValue *= 1 + houseGrowthM
    rent *= 1 + rentGrowthM
    inflationIndex *= 1 + inflM

    if (crossoverYear === null && buyerNetWorth() >= renterPortfolio) {
      crossoverYear = m / 12
    }

    if (m % 12 === 0) {
      series.push(snapshot(m / 12, 12))
      buyerAnnualCost = 0
      renterAnnualCost = 0
    }
  }

  if (months % 12 !== 0) {
    series.push(snapshot(months / 12, months % 12))
  }

  const last = series[series.length - 1]

  return {
    series,
    firstMonth,
    loanAmount,
    deposit,
    purchaseCostsAmount,
    sellingCostsAtHorizon: last.sellingCost,
    monthlyPaymentPI: payment,
    afterTaxAnnual,
    crossoverYear,
    mortgagePaidOffYear,
  }
}

/**
 * The monthly rent (in today's dollars) at which the two paths end with the same
 * net worth. Net worth difference (buyer - renter) is increasing in rent, so we
 * bracket a sign change and bisect.
 */
function solveBreakEvenRent(inputs: Inputs): number | null {
  const diffAtRent = (rentMonthly: number) => {
    const p = project({ ...inputs, rentMonthly })
    const last = p.series[p.series.length - 1]
    return last.buyerNetWorth - last.renterNetWorth
  }

  const f0 = diffAtRent(0)
  if (f0 === 0) return 0
  if (f0 > 0) return null

  let hi = Math.max(inputs.rentMonthly, 500)
  let fhi = diffAtRent(hi)
  let guard = 0
  while (fhi < 0 && guard < 40) {
    hi *= 2
    fhi = diffAtRent(hi)
    guard++
  }
  if (fhi < 0) return null

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

  return {
    series,
    horizonYears: last.year,
    finalBuyerNetWorth: last.buyerNetWorth,
    finalRenterNetWorth: last.renterNetWorth,
    difference: last.buyerNetWorth - last.renterNetWorth,
    buyingWins: last.buyerNetWorth >= last.renterNetWorth,
    crossoverYear: core.crossoverYear,
    mortgagePaidOffYear: core.mortgagePaidOffYear,
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
