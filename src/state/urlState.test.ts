import { describe, expect, it } from 'vitest'
import { NZ_DEFAULTS } from '../defaults'
import { decodeInputs, encodeInputs } from './urlState'

describe('URL input decoding', () => {
  it('falls back to New Zealand for invalid location values', () => {
    expect(decodeInputs('?location=Ontario').location).toBe('New Zealand')
    expect(decodeInputs('?location=New+Zealand').location).toBe('New Zealand')
  })

  it('falls back to defaults for invalid numeric query values', () => {
    const decoded = decodeInputs('?annualIncome=not-a-number&timeHorizonYears=Infinity')

    expect(decoded.annualIncome).toBe(NZ_DEFAULTS.annualIncome)
    expect(decoded.timeHorizonYears).toBe(NZ_DEFAULTS.timeHorizonYears)
  })

  it('clamps out-of-range numeric query values to the same limits as the UI', () => {
    const decoded = decodeInputs(
      '?timeHorizonYears=999&downPayment=-10&assetAllocationPct=120&foreignWithholdingTaxPct=300',
    )

    expect(decoded.timeHorizonYears).toBe(50)
    expect(decoded.downPayment).toBe(0)
    expect(decoded.assetAllocationPct).toBe(100)
    expect(decoded.foreignWithholdingTaxPct).toBe(100)
  })

  it('falls back to defaults for invalid boolean query values', () => {
    expect(decodeInputs('?isPortfolioTaxable=maybe').isPortfolioTaxable).toBe(NZ_DEFAULTS.isPortfolioTaxable)
    expect(decodeInputs('?isPortfolioTaxable=false').isPortfolioTaxable).toBe(false)
    expect(decodeInputs('?propertyTaxIsFixed=maybe').propertyTaxIsFixed).toBe(NZ_DEFAULTS.propertyTaxIsFixed)
  })

  it('decodes fixed owner cost modes and yearly amounts from query values', () => {
    const decoded = decodeInputs(
      '?propertyTaxIsFixed=true&propertyTaxAnnualFixed=3600&maintenanceIsFixed=true&maintenanceAnnualFixed=7200',
    )

    expect(decoded.propertyTaxIsFixed).toBe(true)
    expect(decoded.propertyTaxAnnualFixed).toBe(3600)
    expect(decoded.maintenanceIsFixed).toBe(true)
    expect(decoded.maintenanceAnnualFixed).toBe(7200)
  })

  it('decodes valid expense-mode toggles and ignores invalid ones', () => {
    const decoded = decodeInputs('?downPaymentMode=dollar&maintenanceMode=banana')
    expect(decoded.downPaymentMode).toBe('dollar')
    expect(decoded.maintenanceMode).toBe(NZ_DEFAULTS.maintenanceMode)
  })

  it('round-trips every field through encode → decode', () => {
    const scenario = {
      ...NZ_DEFAULTS,
      downPayment: 150_000,
      downPaymentMode: 'dollar' as const,
      maintenance: 9_000,
      maintenanceMode: 'dollar' as const,
      sellingCosts: 4.5,
      rentGrowthPct: 4,
      investmentFeePct: 0.5,
      otherHomeCostsMonthly: 120,
    }
    const decoded = decodeInputs('?' + encodeInputs(scenario))
    expect(decoded).toEqual(scenario)
  })
})
