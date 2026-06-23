import type { Inputs } from '../types'
import { monthlyMortgagePayment } from './mortgage'
import { afterTaxAnnualReturn } from './tax'

/** Net worth (and its components) for both parties at one yearly snapshot. */
export interface YearPoint {
  year: number
  homeValue: number
  mortgageBalance: number
  homeEquity: number // homeValue - mortgageBalance (gross of selling costs)
  buyerPortfolio: number // side investments the buyer makes when renting would cost more
  buyerNetWorth: number // realisable: equity net of selling costs + side portfolio
  renterNetWorth: number // the invested-difference portfolio (already after-tax, no exit CGT)
}

/** First-month cost components, for the year-1 breakdown UI. */
export interface MonthlyCostBreakdown {
  mortgagePayment: number
  councilRates: number
  maintenance: number
  houseInsurance: number
  bodyCorporate: number
  buyerTotal: number
  rent: number
  contentsInsurance: number
  renterTotal: number
}

export interface SimulationResult {
  series: YearPoint[]
  finalBuyerNetWorth: number
  finalRenterNetWorth: number
  difference: number // buyer - renter at the horizon (positive => buying ahead)
  buyingWins: boolean
  crossoverYear: number | null // first year buyer net worth >= renter net worth
  afterTaxReturnPct: number // blended portfolio after-tax return used (annual %)
  firstMonth: MonthlyCostBreakdown
  loanAmount: number
}

const monthlyRate = (annualFraction: number) => Math.pow(1 + annualFraction, 1 / 12) - 1

/**
 * Month-by-month projection of buying vs renting-and-investing-the-difference.
 *
 * Net worth at any point is "if you cashed out today": the buyer sells the home
 * (paying selling costs) and pays off the mortgage; the renter liquidates the
 * portfolio (no NZ exit tax). The party with the lower housing cost in a given
 * month invests the surplus, so total outflows stay comparable.
 */
export function simulate(inputs: Inputs): SimulationResult {
  const months = Math.max(1, Math.round(inputs.timeHorizonYears * 12))
  const loanAmount = inputs.purchasePrice * (1 - inputs.depositPct / 100)
  const deposit = inputs.purchasePrice * (inputs.depositPct / 100)
  const payment = monthlyMortgagePayment(loanAmount, inputs.mortgageRatePct, inputs.loanTermYears)

  const mRate = inputs.mortgageRatePct / 100 / 12
  const sellFactor = 1 - inputs.sellingCostsPct / 100

  const afterTaxAnnual = afterTaxAnnualReturn(inputs)
  const investM = monthlyRate(afterTaxAnnual)
  const inflM = monthlyRate(inputs.inflationPct / 100)
  const rentGrowthM = monthlyRate(inputs.rentGrowthPct / 100)
  const houseGrowthM = monthlyRate(inputs.houseGrowthPct / 100)

  // State
  let balance = loanAmount
  let homeValue = inputs.purchasePrice
  let rent = inputs.rentMonthly
  let houseIns = inputs.houseInsuranceMonthly
  let contentsIns = inputs.contentsInsuranceMonthly
  let bodyCorp = inputs.bodyCorporateMonthly

  // The renter invests the cash the buyer ties up: deposit + upfront purchase costs.
  let renterPortfolio = deposit + inputs.purchaseCosts
  let buyerPortfolio = 0

  const buyerNetWorth = () => homeValue * sellFactor - balance + buyerPortfolio

  const series: YearPoint[] = [
    {
      year: 0,
      homeValue,
      mortgageBalance: balance,
      homeEquity: homeValue - balance,
      buyerPortfolio,
      buyerNetWorth: buyerNetWorth(),
      renterNetWorth: renterPortfolio,
    },
  ]

  let firstMonth: MonthlyCostBreakdown | null = null

  for (let m = 1; m <= months; m++) {
    // --- Buyer mortgage cash outflow for the month ---
    let mortgageOutflow = 0
    if (balance > 0) {
      const interest = balance * mRate
      let principalPaid = payment - interest
      if (principalPaid > balance) principalPaid = balance
      mortgageOutflow = interest + principalPaid
      balance -= principalPaid
      if (balance < 0.005) balance = 0
    }

    const councilRates = (homeValue * (inputs.councilRatesPct / 100)) / 12
    const maintenance = (homeValue * (inputs.maintenancePct / 100)) / 12
    const buyerCost = mortgageOutflow + councilRates + maintenance + houseIns + bodyCorp
    const renterCost = rent + contentsIns

    if (m === 1) {
      firstMonth = {
        mortgagePayment: mortgageOutflow,
        councilRates,
        maintenance,
        houseInsurance: houseIns,
        bodyCorporate: bodyCorp,
        buyerTotal: buyerCost,
        rent,
        contentsInsurance: contentsIns,
        renterTotal: renterCost,
      }
    }

    // --- Grow portfolios, then invest the monthly difference (end of month) ---
    renterPortfolio *= 1 + investM
    buyerPortfolio *= 1 + investM
    const diff = buyerCost - renterCost
    if (diff > 0) renterPortfolio += diff
    else buyerPortfolio += -diff

    // --- Escalate costs and grow the home for next month ---
    homeValue *= 1 + houseGrowthM
    rent *= 1 + rentGrowthM
    houseIns *= 1 + inflM
    contentsIns *= 1 + inflM
    bodyCorp *= 1 + inflM

    if (m % 12 === 0) {
      series.push({
        year: m / 12,
        homeValue,
        mortgageBalance: balance,
        homeEquity: homeValue - balance,
        buyerPortfolio,
        buyerNetWorth: buyerNetWorth(),
        renterNetWorth: renterPortfolio,
      })
    }
  }

  const last = series[series.length - 1]
  const crossover = series.find((p) => p.year > 0 && p.buyerNetWorth >= p.renterNetWorth)

  return {
    series,
    finalBuyerNetWorth: last.buyerNetWorth,
    finalRenterNetWorth: last.renterNetWorth,
    difference: last.buyerNetWorth - last.renterNetWorth,
    buyingWins: last.buyerNetWorth >= last.renterNetWorth,
    crossoverYear: crossover ? crossover.year : null,
    afterTaxReturnPct: afterTaxAnnual * 100,
    firstMonth: firstMonth!,
    loanAmount,
  }
}
