import { describe, it, expect } from 'vitest'
import { monthlyMortgagePayment, remainingBalance } from './mortgage'
import {
  marginalRate,
  incomeTax,
  grossPortfolioReturn,
  portfolioTaxDrag,
  afterTaxPortfolioReturn,
} from './tax'
import { compositionForAllocation } from './portfolio'
import { simulate } from './simulate'
import { NZ_DEFAULTS } from '../defaults'
import type { Inputs } from '../types'

describe('mortgage', () => {
  it('computes the standard amortising payment', () => {
    // $680,000 at 5.5% over 30 years ≈ $3,861/month
    expect(monthlyMortgagePayment(680_000, 5.5, 30)).toBeCloseTo(3861, -1)
  })

  it('handles a zero interest rate', () => {
    expect(monthlyMortgagePayment(120_000, 0, 10)).toBeCloseTo(1000, 5)
  })

  it('amortises to zero at the end of the term', () => {
    expect(remainingBalance(680_000, 5.5, 30, 360)).toBe(0)
  })
})

describe('NZ income tax', () => {
  it('matches IRD individual tax rates from 1 April 2025 at bracket edges', () => {
    expect(marginalRate(15_600)).toBe(0.105)
    expect(marginalRate(15_601)).toBe(0.175)
    expect(marginalRate(53_500)).toBe(0.175)
    expect(marginalRate(53_501)).toBe(0.3)
    expect(marginalRate(78_100)).toBe(0.3)
    expect(marginalRate(78_101)).toBe(0.33)
    expect(marginalRate(180_000)).toBe(0.33)
    expect(marginalRate(180_001)).toBe(0.39)
  })

  it('returns the right marginal rate per bracket', () => {
    expect(marginalRate(10_000)).toBe(0.105)
    expect(marginalRate(40_000)).toBe(0.175)
    expect(marginalRate(70_000)).toBe(0.3)
    expect(marginalRate(90_000)).toBe(0.33)
    expect(marginalRate(250_000)).toBe(0.39)
  })

  it('computes progressive tax across bands', () => {
    // 15,600*.105 + (53,500-15,600)*.175 = 1638 + 6632.5 = 8270.5
    expect(incomeTax(53_500)).toBeCloseTo(8270.5, 1)
  })
})

describe('asset allocation → return composition', () => {
  it('reproduces PWL defaults at 80% equity', () => {
    const c = compositionForAllocation(80)
    expect(c.eligibleDividendsPct).toBeCloseTo(0.6, 5)
    expect(c.foreignDividendsPct).toBeCloseTo(0.75, 5)
    expect(c.realizedGainsPct).toBeCloseTo(0.43, 5)
    expect(c.unrealizedGainsPct).toBeCloseTo(3.85, 5)
    expect(c.interestIncomePct).toBeCloseTo(0.67, 5)
  })

  it('is all interest at 0% equity and no interest at 100% equity', () => {
    expect(compositionForAllocation(0).interestIncomePct).toBeCloseTo(3.35, 5)
    expect(compositionForAllocation(100).interestIncomePct).toBe(0)
  })
})

describe('NZ portfolio tax', () => {
  it('total gross return is the sum of the composition (≈6.3% on defaults)', () => {
    expect(grossPortfolioReturn(NZ_DEFAULTS)).toBeCloseTo(0.063, 5)
  })

  it('taxes dividends + interest at marginal but never capital gains', () => {
    // income 90k → m=0.33; foreign uses max(m, fwt)=0.33. Gains untaxed.
    // drag = (0.6 + 0.67)*0.33 + 0.75*0.33 = 0.6666 → /100
    expect(portfolioTaxDrag(NZ_DEFAULTS)).toBeCloseTo(0.006666, 5)
    expect(afterTaxPortfolioReturn(NZ_DEFAULTS)).toBeCloseTo(0.056334, 5)
  })

  it('leaves capital gains untaxed in the simplified NZ model', () => {
    const gainsOnly: Inputs = {
      ...NZ_DEFAULTS,
      eligibleDividendsPct: 0,
      foreignDividendsPct: 0,
      interestIncomePct: 0,
      realizedGainsPct: 5,
      unrealizedGainsPct: 8,
    }
    expect(portfolioTaxDrag(gainsOnly)).toBe(0)
    expect(afterTaxPortfolioReturn(gainsOnly)).toBeCloseTo(0.13, 6)
  })

  it('uses foreign withholding when it is higher than the NZ marginal rate', () => {
    const highWithholding: Inputs = {
      ...NZ_DEFAULTS,
      annualIncome: 10_000,
      eligibleDividendsPct: 0,
      foreignDividendsPct: 1,
      interestIncomePct: 0,
      realizedGainsPct: 0,
      unrealizedGainsPct: 0,
      foreignWithholdingTaxPct: 30,
    }
    expect(portfolioTaxDrag(highWithholding)).toBeCloseTo(0.003, 6)
  })

  it('in a sheltered account only foreign withholding tax leaks', () => {
    const sheltered: Inputs = { ...NZ_DEFAULTS, isPortfolioTaxable: false }
    // drag = 0.75 * 0.15 / 100 = 0.001125
    expect(portfolioTaxDrag(sheltered)).toBeCloseTo(0.001125, 6)
  })
})

describe('simulation', () => {
  it('starts both parties level at the deposit when there are no transaction costs', () => {
    const r = simulate({ ...NZ_DEFAULTS, purchaseCostsPct: 0, sellingCostsPct: 0 })
    const y0 = r.series[0]
    const deposit = NZ_DEFAULTS.purchasePrice * (NZ_DEFAULTS.downPaymentPct / 100)
    expect(y0.buyerNetWorth).toBeCloseTo(deposit, 2)
    expect(y0.renterNetWorth).toBeCloseTo(deposit, 2)
  })

  it('charges transaction costs at t=0: renter holds deposit + buying costs, buyer is down selling costs', () => {
    const r = simulate(NZ_DEFAULTS)
    const y0 = r.series[0]
    const deposit = NZ_DEFAULTS.purchasePrice * (NZ_DEFAULTS.downPaymentPct / 100)
    const purchaseCosts = NZ_DEFAULTS.purchasePrice * (NZ_DEFAULTS.purchaseCostsPct / 100)
    const sellingCosts = NZ_DEFAULTS.purchasePrice * (NZ_DEFAULTS.sellingCostsPct / 100)
    expect(y0.renterNetWorth).toBeCloseTo(deposit + purchaseCosts, 2)
    expect(y0.buyerNetWorth).toBeCloseTo(deposit - sellingCosts, 2)
    expect(r.purchaseCosts).toBeCloseTo(purchaseCosts, 2)
  })

  it('reports selling costs at the horizon as a share of the final home value', () => {
    const r = simulate(NZ_DEFAULTS)
    const finalHomeValue = r.series[r.series.length - 1].homeValue
    expect(r.sellingCostsAtHorizon).toBeCloseTo(finalHomeValue * (NZ_DEFAULTS.sellingCostsPct / 100), 2)
  })

  it('higher selling costs strictly reduce buyer final net worth and advantage', () => {
    const base = simulate(NZ_DEFAULTS)
    const dearer = simulate({ ...NZ_DEFAULTS, sellingCostsPct: NZ_DEFAULTS.sellingCostsPct + 2 })
    expect(dearer.finalBuyerNetWorth).toBeLessThan(base.finalBuyerNetWorth)
    expect(dearer.difference).toBeLessThan(base.difference)
  })

  it('higher purchase costs raise renter final net worth', () => {
    const base = simulate(NZ_DEFAULTS)
    const dearer = simulate({ ...NZ_DEFAULTS, purchaseCostsPct: NZ_DEFAULTS.purchaseCostsPct + 2 })
    expect(dearer.finalRenterNetWorth).toBeGreaterThan(base.finalRenterNetWorth)
  })

  it('produces a yearly point per year plus year 0', () => {
    const r = simulate({ ...NZ_DEFAULTS, timeHorizonYears: 10 })
    expect(r.series).toHaveLength(11)
    expect(r.series[r.series.length - 1].year).toBe(10)
  })

  it('favours buying when rent is very high', () => {
    const r = simulate({ ...NZ_DEFAULTS, rentMonthly: 8000, timeHorizonYears: 20 })
    expect(r.buyingWins).toBe(true)
    expect(r.difference).toBeGreaterThan(0)
  })

  it('favours renting when rent is very cheap over a short horizon', () => {
    const r = simulate({ ...NZ_DEFAULTS, rentMonthly: 1000, timeHorizonYears: 5 })
    expect(r.buyingWins).toBe(false)
    expect(r.difference).toBeLessThan(0)
  })

  it('home equity equals value minus balance', () => {
    const p = simulate(NZ_DEFAULTS).series[5]
    expect(p.homeEquity).toBeCloseTo(p.homeValue - p.mortgageBalance, 2)
  })

  it('starts yearly cost and savings fields at zero', () => {
    const y0 = simulate(NZ_DEFAULTS).series[0]

    expect(y0.buyerAnnualCost).toBe(0)
    expect(y0.renterAnnualCost).toBe(0)
    expect(y0.renterAnnualSavings).toBe(0)
  })

  it('accumulates yearly buyer and renter costs from monthly costs', () => {
    const r = simulate({
      ...NZ_DEFAULTS,
      inflationPct: 0,
      realEstateGrowthRatePct: 0,
      timeHorizonYears: 1,
    })
    const y1 = r.series[1]

    expect(y1.buyerAnnualCost).toBeCloseTo(r.firstMonth.buyerTotal * 12, 2)
    expect(y1.renterAnnualCost).toBeCloseTo(r.firstMonth.renterTotal * 12, 2)
  })

  it('reports renter annual savings as buyer cost minus renter cost', () => {
    const y1 = simulate(NZ_DEFAULTS).series[1]

    expect(y1.renterAnnualSavings).toBeCloseTo(y1.buyerAnnualCost - y1.renterAnnualCost, 2)
  })

  it('supports deriving the first year where the mortgage is paid off from the yearly series', () => {
    const paidOff = simulate({
      ...NZ_DEFAULTS,
      purchasePrice: 120_000,
      downPaymentPct: 0,
      amortizationYears: 1,
      interestRatePct: 0,
      realEstateGrowthRatePct: 0,
      timeHorizonYears: 2,
    })
    const withinHorizon = paidOff.series.find((p) => p.year > 0 && p.mortgageBalance === 0)?.year ?? null
    const notWithinHorizon =
      simulate({ ...NZ_DEFAULTS, amortizationYears: 30, timeHorizonYears: 10 }).series.find(
        (p) => p.year > 0 && p.mortgageBalance === 0,
      )?.year ?? null

    expect(withinHorizon).toBe(1)
    expect(notWithinHorizon).toBeNull()
  })
})

describe('fixed-dollar council rates / maintenance', () => {
  it('uses the fixed $/yr amount (÷12) for the first month in fixed mode', () => {
    const r = simulate({ ...NZ_DEFAULTS, propertyTaxIsFixed: true, propertyTaxAnnualFixed: 3600 })
    expect(r.firstMonth.propertyTax).toBeCloseTo(300, 2) // 3600 / 12
  })

  it('fixed mode differs from percent mode for the same scenario', () => {
    const pct = simulate({ ...NZ_DEFAULTS, propertyTaxIsFixed: false })
    const fixed = simulate({ ...NZ_DEFAULTS, propertyTaxIsFixed: true, propertyTaxAnnualFixed: 3600 })
    // percent default ≈ 0.3% × 850k / 12 = 212.5, fixed = 300
    expect(fixed.firstMonth.propertyTax).not.toBeCloseTo(pct.firstMonth.propertyTax, 1)
  })

  it('grows a fixed amount with inflation: year-over-year cost ratio equals inflation', () => {
    const r = simulate({
      ...NZ_DEFAULTS,
      downPaymentPct: 100, // no mortgage, so the buyer's only monthly cost is the fixed rates
      maintenanceCostPct: 0,
      homeInsuranceMonthly: 0,
      realEstateGrowthRatePct: 0,
      propertyTaxIsFixed: true,
      propertyTaxAnnualFixed: 1200,
      inflationPct: 10,
      timeHorizonYears: 2,
    })
    expect(r.series[1].buyerAnnualCost).toBeGreaterThan(0)
    expect(r.series[2].buyerAnnualCost / r.series[1].buyerAnnualCost).toBeCloseTo(1.1, 6)
  })

  it('a larger fixed maintenance amount raises cost and shifts the result toward renting', () => {
    const base = simulate({ ...NZ_DEFAULTS, maintenanceIsFixed: true, maintenanceAnnualFixed: 4000 })
    const dearer = simulate({ ...NZ_DEFAULTS, maintenanceIsFixed: true, maintenanceAnnualFixed: 12000 })
    expect(dearer.firstMonth.maintenance).toBeGreaterThan(base.firstMonth.maintenance)
    // The buyer already out-spends the renter on the defaults, so the monthly surplus accrues to
    // the renter: dearer maintenance lifts the renter's net worth and shrinks the buying advantage.
    expect(dearer.finalRenterNetWorth).toBeGreaterThan(base.finalRenterNetWorth)
    expect(dearer.difference).toBeLessThan(base.difference)
  })
})

describe('fixed-dollar transaction costs (purchase / selling)', () => {
  const deposit = NZ_DEFAULTS.purchasePrice * (NZ_DEFAULTS.downPaymentPct / 100)

  it('uses a fixed $ purchase cost up front, which the renter invests', () => {
    const r = simulate({ ...NZ_DEFAULTS, purchaseCostsIsFixed: true, purchaseCostsFixed: 5000 })
    expect(r.purchaseCosts).toBe(5000)
    expect(r.series[0].renterNetWorth).toBeCloseTo(deposit + 5000, 2)
  })

  it('a fixed $ purchase cost does not scale with the purchase price', () => {
    const cheap = simulate({ ...NZ_DEFAULTS, purchaseCostsIsFixed: true, purchaseCostsFixed: 5000, purchasePrice: 500_000 })
    const dear = simulate({ ...NZ_DEFAULTS, purchaseCostsIsFixed: true, purchaseCostsFixed: 5000, purchasePrice: 1_000_000 })
    expect(cheap.purchaseCosts).toBe(5000)
    expect(dear.purchaseCosts).toBe(5000)
  })

  it('uses a fixed $ selling cost, grown to the sale year by inflation', () => {
    const sellFixed = 10_000
    const years = NZ_DEFAULTS.timeHorizonYears
    const r = simulate({ ...NZ_DEFAULTS, sellingCostsIsFixed: true, sellingCostsFixed: sellFixed })
    expect(r.series[0].buyerNetWorth).toBeCloseTo(deposit - sellFixed, 2) // undiscounted at t=0
    expect(r.sellingCostsAtHorizon).toBeCloseTo(sellFixed * Math.pow(1 + NZ_DEFAULTS.inflationPct / 100, years), 2)
  })

  it('a larger fixed selling cost reduces buyer net worth and advantage', () => {
    const base = simulate({ ...NZ_DEFAULTS, sellingCostsIsFixed: true, sellingCostsFixed: 10_000 })
    const dearer = simulate({ ...NZ_DEFAULTS, sellingCostsIsFixed: true, sellingCostsFixed: 40_000 })
    expect(dearer.finalBuyerNetWorth).toBeLessThan(base.finalBuyerNetWorth)
    expect(dearer.difference).toBeLessThan(base.difference)
  })
})
