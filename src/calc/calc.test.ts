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

  it('in a sheltered account only foreign withholding tax leaks', () => {
    const sheltered: Inputs = { ...NZ_DEFAULTS, isPortfolioTaxable: false }
    // drag = 0.75 * 0.15 / 100 = 0.001125
    expect(portfolioTaxDrag(sheltered)).toBeCloseTo(0.001125, 6)
  })
})

describe('simulation', () => {
  it('starts both parties level at the deposit (no transaction costs)', () => {
    const r = simulate(NZ_DEFAULTS)
    const y0 = r.series[0]
    const deposit = NZ_DEFAULTS.purchasePrice * (NZ_DEFAULTS.downPaymentPct / 100)
    expect(y0.buyerNetWorth).toBeCloseTo(deposit, 2)
    expect(y0.renterNetWorth).toBeCloseTo(deposit, 2)
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
})
