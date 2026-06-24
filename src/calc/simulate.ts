import type { Inputs } from '../types'
import { monthlyMortgagePayment } from './mortgage'
import { afterTaxPortfolioReturn } from './tax'

/** Net worth (and components) for both parties at one yearly snapshot. */
export interface YearPoint {
  year: number
  homeValue: number
  mortgageBalance: number
  homeEquity: number // homeValue - mortgageBalance
  buyerPortfolio: number // side investments the buyer makes when renting would cost more
  buyerNetWorth: number // home equity + side portfolio
  renterNetWorth: number // the invested-difference portfolio (after-tax, no NZ exit CGT)
}

/** First-month cost components, for the year-1 breakdown UI. */
export interface MonthlyCostBreakdown {
  mortgagePayment: number
  propertyTax: number
  maintenance: number
  homeInsurance: number
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
  afterTaxReturnPct: number // blended portfolio after-tax return used (annual %)
  firstMonth: MonthlyCostBreakdown
  loanAmount: number
}

const monthlyRate = (annualFraction: number) => Math.pow(1 + annualFraction, 1 / 12) - 1

/**
 * Month-by-month projection of buying vs renting-and-investing-the-difference,
 * mirroring PWL's methodology: the renter invests the down payment up front, and
 * each month whichever party has the lower housing cost invests the surplus.
 * Net worth = home equity + side investments vs the portfolio.
 */
export function simulate(inputs: Inputs): SimulationResult {
  const months = Math.max(1, Math.round(inputs.timeHorizonYears * 12))
  const loanAmount = inputs.purchasePrice * (1 - inputs.downPaymentPct / 100)
  const deposit = inputs.purchasePrice * (inputs.downPaymentPct / 100)
  const payment = monthlyMortgagePayment(loanAmount, inputs.interestRatePct, inputs.amortizationYears)
  const mRate = inputs.interestRatePct / 100 / 12

  const afterTaxAnnual = afterTaxPortfolioReturn(inputs)
  const investM = monthlyRate(afterTaxAnnual)
  const inflM = monthlyRate(inputs.inflationPct / 100)
  const houseGrowthM = monthlyRate(inputs.realEstateGrowthRatePct / 100)

  let balance = loanAmount
  let homeValue = inputs.purchasePrice
  let rent = inputs.rentMonthly
  let homeIns = inputs.homeInsuranceMonthly
  let rentIns = inputs.rentInsuranceMonthly

  let renterPortfolio = deposit // renter invests the cash the buyer ties up as a deposit
  let buyerPortfolio = 0

  const buyerNetWorth = () => homeValue - balance + buyerPortfolio

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

    const propertyTax = (homeValue * (inputs.propertyTaxRatePct / 100)) / 12
    const maintenance = (homeValue * (inputs.maintenanceCostPct / 100)) / 12
    const buyerCost = mortgageOutflow + propertyTax + maintenance + homeIns
    const renterCost = rent + rentIns

    if (m === 1) {
      firstMonth = {
        mortgagePayment: mortgageOutflow,
        propertyTax,
        maintenance,
        homeInsurance: homeIns,
        buyerTotal: buyerCost,
        rent,
        rentInsurance: rentIns,
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
