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

const deposit = (i: Inputs) => i.purchasePrice * (i.downPayment / 100)

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

  it('still owes the full principal before any payments are made', () => {
    expect(remainingBalance(680_000, 5.5, 30, 0)).toBe(680_000)
  })

  it('falls linearly to half the principal at the midpoint of a zero-rate loan', () => {
    // $120,000 at 0% over 10 years = $1,000/month, so after 60 of 120 payments
    // exactly half the principal remains.
    expect(remainingBalance(120_000, 0, 10, 60)).toBeCloseTo(60_000, 5)
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

  it('matches PWL preset return mixes away from the default allocation', () => {
    expect(compositionForAllocation(0)).toEqual({
      eligibleDividendsPct: 0,
      foreignDividendsPct: 0,
      realizedGainsPct: 0.02,
      unrealizedGainsPct: 0.2,
      interestIncomePct: 3.33,
    })
    expect(compositionForAllocation(50)).toEqual({
      eligibleDividendsPct: 0.39,
      foreignDividendsPct: 0.47,
      realizedGainsPct: 0.28,
      unrealizedGainsPct: 2.55,
      interestIncomePct: 1.67,
    })
    expect(compositionForAllocation(100)).toEqual({
      eligibleDividendsPct: 0.74,
      foreignDividendsPct: 0.94,
      realizedGainsPct: 0.52,
      unrealizedGainsPct: 4.67,
      interestIncomePct: 0,
    })
  })

  it('interpolates custom allocations between neighbouring PWL presets', () => {
    expect(compositionForAllocation(52.5)).toEqual({
      eligibleDividendsPct: 0.41,
      foreignDividendsPct: 0.5,
      realizedGainsPct: 0.3,
      unrealizedGainsPct: 2.66,
      interestIncomePct: 1.59,
    })
  })
})

describe('NZ portfolio tax & fees', () => {
  it('total gross return is the sum of the composition (≈6.3% on defaults)', () => {
    expect(grossPortfolioReturn(NZ_DEFAULTS)).toBeCloseTo(0.063, 5)
  })

  it('taxes dividends + interest at marginal but never capital gains', () => {
    // income 90k → m=0.33; foreign uses max(m, fwt)=0.33. Gains untaxed.
    // drag = (0.6 + 0.67)*0.33 + 0.75*0.33 = 0.6666 → /100
    expect(portfolioTaxDrag(NZ_DEFAULTS)).toBeCloseTo(0.006666, 5)
  })

  it('subtracts the management fee on top of the tax drag', () => {
    // after-tax-after-fee = 0.063 − 0.006666 − 0.0025 (0.25% MER)
    expect(afterTaxPortfolioReturn(NZ_DEFAULTS)).toBeCloseTo(0.053833, 5)
    const noFee = afterTaxPortfolioReturn({ ...NZ_DEFAULTS, investmentFeePct: 0 })
    expect(noFee).toBeCloseTo(0.056334, 5)
    expect(afterTaxPortfolioReturn(NZ_DEFAULTS)).toBeLessThan(noFee)
  })

  it('leaves capital gains untaxed in the simplified NZ model', () => {
    const gainsOnly: Inputs = {
      ...NZ_DEFAULTS,
      investmentFeePct: 0,
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

describe('simulation — structure', () => {
  it('produces a yearly point per year plus year 0', () => {
    const r = simulate({ ...NZ_DEFAULTS, timeHorizonYears: 10 })
    expect(r.series).toHaveLength(11)
    expect(r.series[r.series.length - 1].year).toBe(10)
  })

  it('uses the requested fractional year as the final projection point', () => {
    const r = simulate({ ...NZ_DEFAULTS, timeHorizonYears: 1.5 })

    expect(r.series.map((point) => point.year)).toEqual([0, 1, 1.5])
    expect(r.series.map((point) => point.periodMonths)).toEqual([0, 12, 6])
    expect(r.horizonYears).toBe(1.5)
    expect(r.finalBuyerNetWorth).toBe(r.series[r.series.length - 1].buyerNetWorth)
    expect(r.finalRenterNetWorth).toBe(r.series[r.series.length - 1].renterNetWorth)
  })

  it('labels final partial-period cash flow by the months it actually covers', () => {
    const r = simulate({
      ...NZ_DEFAULTS,
      inflationPct: 0,
      rentGrowthPct: 0,
      realEstateGrowthRatePct: 0,
      timeHorizonYears: 1.5,
    })

    expect(r.series[1].periodMonths).toBe(12)
    expect(r.series[2].periodMonths).toBe(6)
    expect(r.series[2].buyerAnnualCost).toBeCloseTo(r.firstMonth.buyerTotal * 6, 2)
    expect(r.series[2].renterAnnualCost).toBeCloseTo(r.firstMonth.renterTotal * 6, 2)
  })

  it('reports the effective monthly-rounded horizon used by the projection', () => {
    const r = simulate({ ...NZ_DEFAULTS, timeHorizonYears: 1.51 })

    expect(r.series[r.series.length - 1].year).toBe(1.5)
    expect(r.horizonYears).toBe(1.5)
  })

  it('keeps a zero-year horizon at the initial net-worth comparison', () => {
    const r = simulate({ ...NZ_DEFAULTS, timeHorizonYears: 0 })

    expect(r.series.map((point) => point.year)).toEqual([0])
    expect(r.horizonYears).toBe(0)
    expect(r.finalBuyerNetWorth).toBe(r.series[0].buyerNetWorth)
    expect(r.finalRenterNetWorth).toBe(r.series[0].renterNetWorth)
    expect(r.firstMonth.buyerTotal).toBeGreaterThan(0)
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

  it('accumulates yearly buyer and renter costs from monthly costs (flat scenario)', () => {
    const r = simulate({
      ...NZ_DEFAULTS,
      inflationPct: 0,
      rentGrowthPct: 0,
      realEstateGrowthRatePct: 0,
      timeHorizonYears: 1,
    })
    const y1 = r.series[1]
    expect(y1.buyerAnnualCost).toBeCloseTo(r.firstMonth.buyerTotal * 12, 2)
    expect(y1.renterAnnualCost).toBeCloseTo(r.firstMonth.renterTotal * 12, 2)
  })

  it('uses fixed annual council rates and maintenance in the first month when enabled', () => {
    const r = simulate({
      ...NZ_DEFAULTS,
      propertyTax: 3600,
      propertyTaxMode: 'dollar',
      maintenance: 6000,
      maintenanceMode: 'dollar',
    })

    expect(r.firstMonth.propertyTax).toBeCloseTo(300, 5)
    expect(r.firstMonth.maintenance).toBeCloseTo(500, 5)
  })

  it('keeps percentage council rates distinct from fixed annual council rates', () => {
    const fixed = simulate({
      ...NZ_DEFAULTS,
      purchasePrice: 600_000,
      propertyTax: 3600,
      propertyTaxMode: 'dollar',
    })
    const percentage = simulate({
      ...NZ_DEFAULTS,
      purchasePrice: 600_000,
      propertyTax: 1,
      propertyTaxMode: 'pct',
    })

    expect(fixed.firstMonth.propertyTax).toBeCloseTo(300, 5)
    expect(percentage.firstMonth.propertyTax).toBeCloseTo(500, 5)
  })

  it('escalates fixed annual council rates with inflation', () => {
    const r = simulate({
      ...NZ_DEFAULTS,
      timeHorizonYears: 2,
      purchasePrice: 100_000,
      downPayment: 100,
      downPaymentMode: 'pct',
      propertyTax: 1200,
      propertyTaxMode: 'dollar',
      maintenance: 0,
      maintenanceMode: 'dollar',
      homeInsurance: 0,
      homeInsuranceMode: 'dollar',
      otherHomeCostsMonthly: 0,
      rentMonthly: 0,
      rentInsuranceMonthly: 0,
      rentGrowthPct: 0,
      inflationPct: 10,
      realEstateGrowthRatePct: 0,
    })
    const year1 = r.series[1].buyerAnnualCost
    const year2 = r.series[2].buyerAnnualCost

    expect(year2 - year1).toBeCloseTo(year1 * 0.1, 2)
  })

  it('higher fixed annual owner costs increase buyer costs and reduce buyer net worth when buying is cheaper', () => {
    const lowCosts = simulate({
      ...NZ_DEFAULTS,
      timeHorizonYears: 1,
      rentMonthly: 10_000,
      rentInsuranceMonthly: 0,
      propertyTax: 1200,
      propertyTaxMode: 'dollar',
      maintenance: 1200,
      maintenanceMode: 'dollar',
    })
    const highCosts = simulate({
      ...NZ_DEFAULTS,
      timeHorizonYears: 1,
      rentMonthly: 10_000,
      rentInsuranceMonthly: 0,
      propertyTax: 7200,
      propertyTaxMode: 'dollar',
      maintenance: 7200,
      maintenanceMode: 'dollar',
    })

    expect(highCosts.series[1].buyerAnnualCost).toBeGreaterThan(lowCosts.series[1].buyerAnnualCost)
    expect(highCosts.finalBuyerNetWorth).toBeLessThan(lowCosts.finalBuyerNetWorth)
  })

  it('reports renter annual savings as buyer cost minus renter cost', () => {
    const y1 = simulate(NZ_DEFAULTS).series[1]
    expect(y1.renterAnnualSavings).toBeCloseTo(y1.buyerAnnualCost - y1.renterAnnualCost, 2)
  })

  it('reports the first monthly point where the mortgage is paid off', () => {
    const paidOff = simulate({
      ...NZ_DEFAULTS,
      purchasePrice: 120_000,
      downPayment: 0,
      amortizationYears: 0.5,
      interestRatePct: 0,
      realEstateGrowthRatePct: 0,
      timeHorizonYears: 1,
    })
    const notWithinHorizon = simulate({ ...NZ_DEFAULTS, amortizationYears: 30, timeHorizonYears: 10 })

    expect(paidOff.mortgagePaidOffYear).toBeCloseTo(0.5, 8)
    expect(notWithinHorizon.mortgagePaidOffYear).toBeNull()
  })

  it('does not report a mortgage payoff marker when there is no mortgage', () => {
    const cashPurchase = simulate({
      ...NZ_DEFAULTS,
      downPayment: 100,
      downPaymentMode: 'pct',
    })

    expect(cashPurchase.loanAmount).toBe(0)
    expect(cashPurchase.mortgagePaidOffYear).toBeNull()
  })
})

describe('simulation — down payment modes', () => {
  it('treats a dollar deposit identically to the equivalent percentage', () => {
    const pct = simulate({ ...NZ_DEFAULTS, downPayment: 20, downPaymentMode: 'pct' })
    const dollar = simulate({ ...NZ_DEFAULTS, downPayment: 170_000, downPaymentMode: 'dollar' })
    expect(dollar.deposit).toBeCloseTo(pct.deposit, 2)
    expect(dollar.loanAmount).toBeCloseTo(pct.loanAmount, 2)
  })

  it('a 100% deposit leaves no mortgage', () => {
    const allCash = simulate({ ...NZ_DEFAULTS, downPayment: 100, downPaymentMode: 'pct' })
    expect(allCash.loanAmount).toBe(0)
    expect(allCash.monthlyPaymentPI).toBe(0)
    expect(allCash.firstMonth.mortgagePayment).toBe(0)
  })

  it('clamps a dollar deposit larger than the price to the price (no negative loan)', () => {
    const over = simulate({ ...NZ_DEFAULTS, downPayment: 9_000_000, downPaymentMode: 'dollar' })
    expect(over.loanAmount).toBe(0)
    expect(over.deposit).toBeCloseTo(NZ_DEFAULTS.purchasePrice, 2)
  })
})

describe('simulation — transaction & selling costs', () => {
  it('with no transaction costs both parties start level at the deposit', () => {
    const r = simulate({ ...NZ_DEFAULTS, purchaseCosts: 0, sellingCosts: 0 })
    const y0 = r.series[0]
    expect(y0.buyerNetWorth).toBeCloseTo(deposit(NZ_DEFAULTS), 2)
    expect(y0.renterNetWorth).toBeCloseTo(deposit(NZ_DEFAULTS), 2)
  })

  it('seeds the renter with the deposit plus upfront buying costs', () => {
    const r = simulate(NZ_DEFAULTS)
    const y0 = r.series[0]
    expect(r.purchaseCostsAmount).toBeCloseTo(2_500, 2)
    expect(y0.renterNetWorth).toBeCloseTo(r.deposit + r.purchaseCostsAmount, 2)
  })

  it('values the buyer at liquidation: equity minus the cost to sell now', () => {
    const r = simulate(NZ_DEFAULTS)
    const y0 = r.series[0]
    // selling cost 2.9% of $850,000 = $24,650
    expect(y0.sellingCost).toBeCloseTo(850_000 * 0.029, 2)
    expect(y0.buyerNetWorth).toBeCloseTo(r.deposit - y0.sellingCost, 2)
    // The renter therefore starts ahead by buying costs + immediate selling cost.
    expect(y0.renterNetWorth - y0.buyerNetWorth).toBeCloseTo(r.purchaseCostsAmount + y0.sellingCost, 2)
  })

  it('higher selling costs reduce final buyer net worth', () => {
    const more = simulate({ ...NZ_DEFAULTS, sellingCosts: 6, sellingCostsMode: 'pct' })
    const less = simulate({ ...NZ_DEFAULTS, sellingCosts: 1, sellingCostsMode: 'pct' })
    expect(more.finalBuyerNetWorth).toBeLessThan(less.finalBuyerNetWorth)
  })
})

describe('simulation — recurring expense modes', () => {
  it('matches a percentage to its equivalent dollar amount at the start', () => {
    // 1% of $850,000 = $8,500/yr maintenance
    const pct = simulate({ ...NZ_DEFAULTS, maintenance: 1, maintenanceMode: 'pct' })
    const dollar = simulate({ ...NZ_DEFAULTS, maintenance: 8_500, maintenanceMode: 'dollar' })
    expect(pct.firstMonth.maintenance).toBeCloseTo(dollar.firstMonth.maintenance, 2)
  })

  it('a percentage tracks the home value while a fixed dollar tracks inflation', () => {
    const yrs = 15
    const pct = simulate({ ...NZ_DEFAULTS, maintenance: 1, maintenanceMode: 'pct', timeHorizonYears: yrs })
    const dollar = simulate({
      ...NZ_DEFAULTS,
      maintenance: 8_500,
      maintenanceMode: 'dollar',
      timeHorizonYears: yrs,
    })
    // Home grows 3.5%/yr, inflation 2.5%/yr, so the % version costs more later on.
    const lastPct = pct.series[pct.series.length - 1].buyerAnnualCost
    const lastDollar = dollar.series[dollar.series.length - 1].buyerAnnualCost
    expect(lastPct).toBeGreaterThan(lastDollar)
  })
})

describe('simulation — rent growth & fees', () => {
  it('faster rent growth favours buying', () => {
    const fast = simulate({ ...NZ_DEFAULTS, rentGrowthPct: 6, timeHorizonYears: 20 })
    const slow = simulate({ ...NZ_DEFAULTS, rentGrowthPct: 1, timeHorizonYears: 20 })
    expect(fast.difference).toBeGreaterThan(slow.difference)
  })

  it('a higher management fee lowers the return and the renter portfolio', () => {
    const lowFee = simulate({ ...NZ_DEFAULTS, investmentFeePct: 0 })
    const highFee = simulate({ ...NZ_DEFAULTS, investmentFeePct: 2 })
    expect(highFee.afterTaxReturnPct).toBeLessThan(lowFee.afterTaxReturnPct)
    expect(highFee.finalRenterNetWorth).toBeLessThan(lowFee.finalRenterNetWorth)
  })
})

describe('simulation — headline outcomes', () => {
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

  it('reports the first monthly point where buying catches renting', () => {
    const r = simulate({
      ...NZ_DEFAULTS,
      timeHorizonYears: 1,
      purchasePrice: 120_000,
      downPayment: 100,
      downPaymentMode: 'pct',
      interestRatePct: 0,
      purchaseCosts: 0,
      sellingCosts: 1,
      propertyTax: 0,
      propertyTaxMode: 'pct',
      maintenance: 0,
      maintenanceMode: 'pct',
      homeInsurance: 0,
      homeInsuranceMode: 'dollar',
      otherHomeCostsMonthly: 0,
      rentMonthly: 2000,
      rentInsuranceMonthly: 0,
      rentGrowthPct: 0,
      inflationPct: 0,
      realEstateGrowthRatePct: 0,
      investmentFeePct: 0,
      eligibleDividendsPct: 0,
      foreignDividendsPct: 0,
      unrealizedGainsPct: 0,
      realizedGainsPct: 0,
      interestIncomePct: 0,
    })

    expect(r.series[0].buyerNetWorth).toBeLessThan(r.series[0].renterNetWorth)
    expect(r.crossoverYear).toBeCloseTo(1 / 12, 8)
  })

  it('reports immediate break-even when buying starts level with renting', () => {
    const r = simulate({
      ...NZ_DEFAULTS,
      purchaseCosts: 0,
      sellingCosts: 0,
    })

    expect(r.series[0].buyerNetWorth).toBeCloseTo(r.series[0].renterNetWorth, 2)
    expect(r.crossoverYear).toBe(0)
  })
})

describe('simulation — break-even rent', () => {
  it('finds a positive rent at which the two paths are level', () => {
    const r = simulate(NZ_DEFAULTS)
    expect(r.breakEvenRent).not.toBeNull()
    expect(r.breakEvenRent!).toBeGreaterThan(0)
  })

  it('the difference is ~zero exactly at the break-even rent', () => {
    const r = simulate(NZ_DEFAULTS)
    const atBreakEven = simulate({ ...NZ_DEFAULTS, rentMonthly: r.breakEvenRent! })
    expect(Math.abs(atBreakEven.difference)).toBeLessThan(50)
  })

  it('renting wins below the break-even rent and buying wins above it', () => {
    const r = simulate(NZ_DEFAULTS)
    const below = simulate({ ...NZ_DEFAULTS, rentMonthly: r.breakEvenRent! - 400 })
    const above = simulate({ ...NZ_DEFAULTS, rentMonthly: r.breakEvenRent! + 400 })
    expect(below.difference).toBeLessThan(0)
    expect(above.difference).toBeGreaterThan(0)
  })

  it('returns null (with buying ahead) when buying wins even at zero rent', () => {
    // Mortgage-free, costless ownership with strong appreciation beats investing at any rent.
    const r = simulate({
      ...NZ_DEFAULTS,
      downPayment: 100,
      downPaymentMode: 'pct',
      purchaseCosts: 0,
      sellingCosts: 0,
      propertyTax: 0,
      propertyTaxMode: 'pct',
      maintenance: 0,
      maintenanceMode: 'pct',
      homeInsurance: 0,
      homeInsuranceMode: 'dollar',
      otherHomeCostsMonthly: 0,
      rentInsuranceMonthly: 0,
      realEstateGrowthRatePct: 10,
      timeHorizonYears: 15,
    })
    expect(r.breakEvenRent).toBeNull()
    expect(r.difference).toBeGreaterThan(0)
  })
})

describe('simulation — robustness across extreme inputs', () => {
  it('keeps projections finite when growth-style rates are below -100%', () => {
    const r = simulate({
      ...NZ_DEFAULTS,
      timeHorizonYears: 2,
      inflationPct: -150,
      rentGrowthPct: -150,
      realEstateGrowthRatePct: -150,
    })
    const numericValues = [
      r.finalBuyerNetWorth,
      r.finalRenterNetWorth,
      r.difference,
      r.firstMonth.buyerTotal,
      ...r.series.flatMap((point) => [
        point.homeValue,
        point.mortgageBalance,
        point.homeEquity,
        point.sellingCost,
        point.buyerPortfolio,
        point.buyerNetWorth,
        point.renterNetWorth,
        point.buyerAnnualCost,
        point.renterAnnualCost,
        point.renterAnnualSavings,
      ]),
    ]

    expect(numericValues.every(Number.isFinite)).toBe(true)
  })

  it('never produces NaN net worth, even with extreme rates', () => {
    const cases: Partial<Inputs>[] = [
      { purchasePrice: 0 },
      { interestRatePct: 0 },
      { realEstateGrowthRatePct: -100 },
      { inflationPct: -50 },
      { rentGrowthPct: -50 },
      { investmentFeePct: 100 },
      { timeHorizonYears: 1, amortizationYears: 40 },
      { downPayment: 0, downPaymentMode: 'pct' },
      { assetAllocationPct: 0 },
      { assetAllocationPct: 100 },
    ]
    for (const patch of cases) {
      const r = simulate({ ...NZ_DEFAULTS, ...patch })
      for (const p of r.series) {
        expect(Number.isFinite(p.buyerNetWorth)).toBe(true)
        expect(Number.isFinite(p.renterNetWorth)).toBe(true)
      }
      expect(Number.isFinite(r.difference)).toBe(true)
    }
  })

  it('keeps projections finite and period-labelled across UI boundary scenarios', () => {
    const scenarios: Inputs[] = [
      {
        ...NZ_DEFAULTS,
        timeHorizonYears: 0,
        annualIncome: 0,
        purchasePrice: 0,
        downPayment: 0,
        downPaymentMode: 'pct',
        amortizationYears: 1,
        interestRatePct: 0,
        purchaseCosts: 0,
        sellingCosts: 0,
        propertyTax: 0,
        propertyTaxMode: 'pct',
        maintenance: 0,
        maintenanceMode: 'pct',
        homeInsurance: 0,
        homeInsuranceMode: 'dollar',
        otherHomeCostsMonthly: 0,
        realEstateGrowthRatePct: -100,
        rentMonthly: 0,
        rentInsuranceMonthly: 0,
        rentGrowthPct: -100,
        assetAllocationPct: 0,
        inflationPct: -100,
        investmentFeePct: 0,
        eligibleDividendsPct: 0,
        foreignDividendsPct: 0,
        unrealizedGainsPct: 0,
        realizedGainsPct: 0,
        interestIncomePct: 0,
        foreignWithholdingTaxPct: 0,
      },
      {
        ...NZ_DEFAULTS,
        timeHorizonYears: 100,
        annualIncome: 1_000_000,
        purchasePrice: 5_000_000,
        downPayment: 0,
        downPaymentMode: 'pct',
        amortizationYears: 40,
        interestRatePct: 10,
        purchaseCosts: 100,
        purchaseCostsMode: 'pct',
        sellingCosts: 100,
        sellingCostsMode: 'pct',
        propertyTax: 10,
        propertyTaxMode: 'pct',
        maintenance: 10,
        maintenanceMode: 'pct',
        homeInsurance: 10_000,
        homeInsuranceMode: 'dollar',
        otherHomeCostsMonthly: 10_000,
        realEstateGrowthRatePct: 10,
        rentMonthly: 10_000,
        rentInsuranceMonthly: 10_000,
        rentGrowthPct: 10,
        assetAllocationPct: 100,
        inflationPct: 10,
        investmentFeePct: 100,
        eligibleDividendsPct: 10,
        foreignDividendsPct: 10,
        unrealizedGainsPct: 10,
        realizedGainsPct: 10,
        interestIncomePct: 10,
        foreignWithholdingTaxPct: 100,
      },
      {
        ...NZ_DEFAULTS,
        timeHorizonYears: 1.5,
        purchasePrice: 5_000_000,
        downPayment: 100,
        downPaymentMode: 'pct',
        amortizationYears: 1,
        propertyTax: 1_000_000,
        propertyTaxMode: 'dollar',
        maintenance: 1_000_000,
        maintenanceMode: 'dollar',
        rentMonthly: 10_000,
        inflationPct: 10,
      },
    ]

    for (const scenario of scenarios) {
      const r = simulate(scenario)
      const numericValues = [
        r.horizonYears,
        r.finalBuyerNetWorth,
        r.finalRenterNetWorth,
        r.difference,
        r.afterTaxReturnPct,
        r.loanAmount,
        r.deposit,
        r.purchaseCostsAmount,
        r.sellingCostsAtHorizon,
        r.monthlyPaymentPI,
        r.firstMonth.mortgagePayment,
        r.firstMonth.propertyTax,
        r.firstMonth.maintenance,
        r.firstMonth.homeInsurance,
        r.firstMonth.otherHomeCosts,
        r.firstMonth.buyerTotal,
        r.firstMonth.rent,
        r.firstMonth.rentInsurance,
        r.firstMonth.renterTotal,
        ...r.series.flatMap((point) => [
          point.year,
          point.periodMonths,
          point.homeValue,
          point.mortgageBalance,
          point.homeEquity,
          point.sellingCost,
          point.buyerPortfolio,
          point.buyerNetWorth,
          point.renterNetWorth,
          point.buyerAnnualCost,
          point.renterAnnualCost,
          point.renterAnnualSavings,
        ]),
      ]

      expect(numericValues.every(Number.isFinite)).toBe(true)
      expect(r.series.reduce((total, point) => total + point.periodMonths, 0)).toBe(
        Math.round(scenario.timeHorizonYears * 12),
      )
      expect(r.series[0].periodMonths).toBe(0)
      expect(r.series.slice(1).every((point) => point.periodMonths > 0 && point.periodMonths <= 12)).toBe(true)
    }
  })
})
