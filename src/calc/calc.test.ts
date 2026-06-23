import { describe, it, expect } from 'vitest'
import { monthlyMortgagePayment, remainingBalance } from './mortgage'
import { marginalRate, incomeTax, fdrDrag, afterTaxAnnualReturn } from './tax'
import { simulate } from './simulate'
import { NZ_DEFAULTS } from '../defaults'
import type { Inputs } from '../types'

describe('mortgage', () => {
  it('computes the standard amortising payment', () => {
    // $680,000 at 5.5% over 30 years ≈ $3,861/month
    const payment = monthlyMortgagePayment(680_000, 5.5, 30)
    expect(payment).toBeCloseTo(3861, -1) // within ~$10
  })

  it('handles a zero interest rate', () => {
    expect(monthlyMortgagePayment(120_000, 0, 10)).toBeCloseTo(1000, 5)
  })

  it('amortises to zero at the end of the term', () => {
    expect(remainingBalance(680_000, 5.5, 30, 360)).toBe(0)
  })

  it('leaves most principal outstanding early in the term', () => {
    const bal = remainingBalance(680_000, 5.5, 30, 60) // after 5 years
    expect(bal).toBeGreaterThan(620_000)
    expect(bal).toBeLessThan(680_000)
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

describe('portfolio after-tax return (FIF/PIR)', () => {
  it('FDR drag is 5% of value times PIR', () => {
    expect(fdrDrag(28)).toBeCloseTo(0.014, 6) // 1.40% at 28% PIR
  })

  it('blends equity (FDR) and bond (PIR on interest) returns', () => {
    // 80% equity: 6.5% - 1.4% = 5.1%; 20% bond: 4% * 0.72 = 2.88%
    // blend = .8*.051 + .2*.0288 = .04656
    const r = afterTaxAnnualReturn({
      equityAllocationPct: 80,
      equityReturnPct: 6.5,
      bondReturnPct: 4,
      pirPct: 28,
    })
    expect(r).toBeCloseTo(0.04656, 5)
  })
})

describe('simulation', () => {
  it('starts the renter ahead by the buyer transaction costs', () => {
    const r = simulate(NZ_DEFAULTS)
    const y0 = r.series[0]
    // At t=0 the buyer is behind by purchase costs + selling costs on the home.
    expect(y0.renterNetWorth).toBeGreaterThan(y0.buyerNetWorth)
  })

  it('produces a yearly point per year plus year 0', () => {
    const r = simulate({ ...NZ_DEFAULTS, timeHorizonYears: 10 })
    expect(r.series).toHaveLength(11)
    expect(r.series[r.series.length - 1].year).toBe(10)
  })

  it('favours buying when rent is very high', () => {
    const expensiveRent: Inputs = { ...NZ_DEFAULTS, rentMonthly: 6000, timeHorizonYears: 15 }
    const r = simulate(expensiveRent)
    expect(r.buyingWins).toBe(true)
    expect(r.difference).toBeGreaterThan(0)
  })

  it('favours renting when rent is very cheap over a short horizon', () => {
    const cheapRent: Inputs = { ...NZ_DEFAULTS, rentMonthly: 1500, timeHorizonYears: 5 }
    const r = simulate(cheapRent)
    expect(r.buyingWins).toBe(false)
    expect(r.difference).toBeLessThan(0)
  })

  it('detects a crossover year when buying overtakes renting', () => {
    const r = simulate({ ...NZ_DEFAULTS, rentMonthly: 4500, timeHorizonYears: 25 })
    expect(r.crossoverYear).not.toBeNull()
    expect(r.crossoverYear!).toBeGreaterThan(0)
  })

  it('home equity equals value minus balance', () => {
    const r = simulate(NZ_DEFAULTS)
    const p = r.series[5]
    expect(p.homeEquity).toBeCloseTo(p.homeValue - p.mortgageBalance, 2)
  })
})
