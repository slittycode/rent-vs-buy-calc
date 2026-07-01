// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { SimulationResult } from '../calc/simulate'
import ResultsSummary, { BreakEvenSummary } from './ResultsSummary'

afterEach(cleanup)

const baseResult: SimulationResult = {
  series: [],
  horizonYears: 10,
  finalBuyerNetWorth: 500_000,
  finalRenterNetWorth: 500_000,
  difference: 0,
  buyingWins: true,
  crossoverYear: 1,
  mortgagePaidOffYear: null,
  afterTaxReturnPct: 4,
  firstMonth: {
    mortgagePayment: 0,
    propertyTax: 0,
    maintenance: 0,
    homeInsurance: 0,
    otherHomeCosts: 0,
    buyerTotal: 0,
    rent: 0,
    rentInsurance: 0,
    renterTotal: 0,
  },
  loanAmount: 0,
  deposit: 0,
  purchaseCostsAmount: 0,
  sellingCostsAtHorizon: 0,
  monthlyPaymentPI: 0,
  breakEvenRent: null,
}

describe('ResultsSummary', () => {
  it('uses neutral copy when the projected net worth is tied', () => {
    render(<ResultsSummary result={baseResult} rentMonthly={0} purchasePrice={500_000} />)

    expect(screen.getAllByText('Both paths finish with the same projected net worth')).toHaveLength(2)
    expect(screen.getByText(/both paths end with the same projected net worth/i)).toBeTruthy()
    expect(screen.getByText('No advantage')).toBeTruthy()
    expect(screen.queryByText(/is ahead by/i)).toBeNull()
  })

  it('labels results with the effective projected horizon', () => {
    render(
      <ResultsSummary
        result={{ ...baseResult, horizonYears: 1.5 }}
        rentMonthly={0}
        purchasePrice={500_000}
      />,
    )

    expect(screen.getByText(/^After 1.5 years,/i)).toBeTruthy()
    expect(screen.getByText(/Final net worth after 1.5 years/i)).toBeTruthy()
  })

  it('does not show a zero percent advantage when the other path ends at zero', () => {
    render(
      <ResultsSummary
        result={{
          ...baseResult,
          finalBuyerNetWorth: 10_000,
          finalRenterNetWorth: 0,
          difference: 10_000,
          buyingWins: true,
        }}
        rentMonthly={0}
        purchasePrice={500_000}
      />,
    )

    expect(screen.getByText('Buying advantage')).toBeTruthy()
    expect(screen.getByText('Percentage advantage is not meaningful because the other path is $0')).toBeTruthy()
    expect(screen.queryByText('0.0% ahead of the other path')).toBeNull()
  })

  it('does not show a huge percentage advantage when the other path rounds to zero dollars', () => {
    render(
      <ResultsSummary
        result={{
          ...baseResult,
          finalBuyerNetWorth: 10_000,
          finalRenterNetWorth: 0.49,
          difference: 9_999.51,
          buyingWins: true,
        }}
        rentMonthly={0}
        purchasePrice={500_000}
      />,
    )

    expect(screen.getByText('Buying advantage')).toBeTruthy()
    expect(screen.getByText('Percentage advantage is not meaningful because the other path is $0')).toBeTruthy()
    expect(screen.queryByText(/ahead of the other path/)).toBeNull()
  })

  it('does not show a zero rent-to-price ratio when purchase price is zero', () => {
    render(<ResultsSummary result={baseResult} rentMonthly={2_000} purchasePrice={0} />)

    expect(screen.getByText('Rent/Purchase Price')).toBeTruthy()
    expect(screen.getByText('N/A')).toBeTruthy()
    expect(screen.getByText('Rent/Purchase Price is not meaningful because purchase price is $0')).toBeTruthy()
    expect(screen.queryByText('0.0%')).toBeNull()
  })

  it('labels monthly break-even timing without rounding up to a full year', () => {
    render(<BreakEvenSummary result={{ ...baseResult, crossoverYear: 1 / 12 }} />)

    expect(screen.getByText('First time buying catches up')).toBeTruthy()
    expect(screen.getByText('0.08 years')).toBeTruthy()
    expect(screen.queryByText('Year 0.08333333333333333')).toBeNull()
  })
})
