// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { SimulationResult } from '../calc/simulate'
import CostBreakdown from './CostBreakdown'

afterEach(cleanup)

const equalCostResult: SimulationResult = {
  series: [],
  horizonYears: 10,
  finalBuyerNetWorth: 0,
  finalRenterNetWorth: 0,
  difference: 0,
  buyingWins: true,
  crossoverYear: null,
  mortgagePaidOffYear: null,
  afterTaxReturnPct: 0,
  firstMonth: {
    mortgagePayment: 1000,
    propertyTax: 100,
    maintenance: 100,
    homeInsurance: 50,
    otherHomeCosts: 0,
    buyerTotal: 1250,
    rent: 1200,
    rentInsurance: 50,
    renterTotal: 1250,
  },
  loanAmount: 0,
  deposit: 0,
  purchaseCostsAmount: 0,
  sellingCostsAtHorizon: 0,
  monthlyPaymentPI: 0,
  breakEvenRent: null,
}

describe('CostBreakdown', () => {
  it('uses neutral copy when first-month owning and renting costs are equal', () => {
    render(<CostBreakdown result={equalCostResult} horizon={10} />)

    expect(screen.getByText('Owning and renting cost the same per month to start.')).toBeTruthy()
    expect(screen.queryByText(/Owning costs \$0 more per month than renting to start/i)).toBeNull()
  })
})
