import { describe, expect, it } from 'vitest'
import { NZ_DEFAULTS } from '../defaults'
import { REGION_PRESETS } from '../regions'
import { decodeInputs } from './urlState'

describe('URL input decoding', () => {
  it('falls back to New Zealand for invalid location values', () => {
    expect(decodeInputs('?location=Ontario').location).toBe('New Zealand')
    expect(decodeInputs('?location=New+Zealand').location).toBe('New Zealand')
  })

  it('seeds market fields from the location preset', () => {
    const decoded = decodeInputs('?location=Auckland')

    expect(decoded.location).toBe('Auckland')
    expect(decoded.purchasePrice).toBe(REGION_PRESETS.Auckland.purchasePrice)
    expect(decoded.rentMonthly).toBe(REGION_PRESETS.Auckland.rentMonthly)
    expect(decoded.propertyTaxRatePct).toBe(REGION_PRESETS.Auckland.propertyTaxRatePct)
  })

  it('lets an explicit param override the location preset', () => {
    const decoded = decodeInputs('?location=Auckland&purchasePrice=2000000')

    expect(decoded.location).toBe('Auckland')
    expect(decoded.purchasePrice).toBe(2_000_000)
    // Untouched fields still come from the Auckland preset.
    expect(decoded.rentMonthly).toBe(REGION_PRESETS.Auckland.rentMonthly)
  })

  it('falls back to defaults for invalid numeric query values', () => {
    const decoded = decodeInputs('?annualIncome=not-a-number&timeHorizonYears=Infinity')

    expect(decoded.annualIncome).toBe(NZ_DEFAULTS.annualIncome)
    expect(decoded.timeHorizonYears).toBe(NZ_DEFAULTS.timeHorizonYears)
  })

  it('clamps out-of-range numeric query values to the same limits as the UI', () => {
    const decoded = decodeInputs(
      '?timeHorizonYears=999&downPaymentPct=-10&assetAllocationPct=120&foreignWithholdingTaxPct=300',
    )

    expect(decoded.timeHorizonYears).toBe(50)
    expect(decoded.downPaymentPct).toBe(0)
    expect(decoded.assetAllocationPct).toBe(100)
    expect(decoded.foreignWithholdingTaxPct).toBe(100)
  })

  it('falls back to defaults for invalid boolean query values', () => {
    expect(decodeInputs('?isPortfolioTaxable=maybe').isPortfolioTaxable).toBe(NZ_DEFAULTS.isPortfolioTaxable)
    expect(decodeInputs('?isPortfolioTaxable=false').isPortfolioTaxable).toBe(false)
  })
})
