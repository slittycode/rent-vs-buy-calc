import { describe, expect, it } from 'vitest'
import { NZ_DEFAULTS } from '../defaults'
import { REGION_PRESETS } from '../regions'
import { decodeInputs, encodeInputs } from './urlState'

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
    expect(decoded.propertyTax).toBe(REGION_PRESETS.Auckland.propertyTax)
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
      '?timeHorizonYears=999&downPayment=-10&assetAllocationPct=120&foreignWithholdingTaxPct=300&inflationPct=-150&realEstateGrowthRatePct=-120',
    )

    expect(decoded.timeHorizonYears).toBe(100)
    expect(decoded.downPayment).toBe(0)
    expect(decoded.assetAllocationPct).toBe(100)
    expect(decoded.foreignWithholdingTaxPct).toBe(100)
    expect(decoded.inflationPct).toBe(-100)
    expect(decoded.realEstateGrowthRatePct).toBe(-100)
  })

  it('preserves PWL-compatible time horizons from 0 to 100 years', () => {
    expect(decodeInputs('?timeHorizonYears=0').timeHorizonYears).toBe(0)
    expect(decodeInputs('?timeHorizonYears=75').timeHorizonYears).toBe(75)
    expect(decodeInputs('?timeHorizonYears=101').timeHorizonYears).toBe(100)
  })

  it('caps shared PWL-style inputs at the same upper limits as the UI', () => {
    const decoded = decodeInputs(
      '?annualIncome=9999999&purchasePrice=99999999&interestRatePct=99&propertyTax=99&maintenance=99&homeInsurance=999999&otherHomeCostsMonthly=99999&rentMonthly=99999&rentInsuranceMonthly=99999&eligibleDividendsPct=99&foreignDividendsPct=99&unrealizedGainsPct=99&realizedGainsPct=99&interestIncomePct=99&inflationPct=99&realEstateGrowthRatePct=99&rentGrowthPct=99',
    )

    expect(decoded.annualIncome).toBe(1_000_000)
    expect(decoded.purchasePrice).toBe(5_000_000)
    expect(decoded.interestRatePct).toBe(10)
    expect(decoded.propertyTax).toBe(99)
    expect(decoded.maintenance).toBe(99)
    expect(decoded.homeInsurance).toBe(999999)
    expect(decoded.otherHomeCostsMonthly).toBe(10_000)
    expect(decoded.rentMonthly).toBe(10_000)
    expect(decoded.rentInsuranceMonthly).toBe(10_000)
    expect(decoded.eligibleDividendsPct).toBe(10)
    expect(decoded.foreignDividendsPct).toBe(10)
    expect(decoded.unrealizedGainsPct).toBe(10)
    expect(decoded.realizedGainsPct).toBe(10)
    expect(decoded.interestIncomePct).toBe(10)
    expect(decoded.inflationPct).toBe(10)
    expect(decoded.realEstateGrowthRatePct).toBe(10)
    expect(decoded.rentGrowthPct).toBe(10)
  })

  it('falls back to defaults for invalid boolean query values', () => {
    expect(decodeInputs('?isPortfolioTaxable=maybe').isPortfolioTaxable).toBe(NZ_DEFAULTS.isPortfolioTaxable)
    expect(decodeInputs('?isPortfolioTaxable=false').isPortfolioTaxable).toBe(false)
    expect(decodeInputs('?isPortfolioTaxable=False').isPortfolioTaxable).toBe(false)
  })

  it('decodes old fixed owner cost links into current dollar modes', () => {
    const decoded = decodeInputs(
      '?propertyTaxIsFixed=true&propertyTaxAnnualFixed=3600&maintenanceIsFixed=true&maintenanceAnnualFixed=7200',
    )

    expect(decoded.propertyTaxMode).toBe('dollar')
    expect(decoded.propertyTax).toBe(3600)
    expect(decoded.maintenanceMode).toBe('dollar')
    expect(decoded.maintenance).toBe(7200)
  })

  it('decodes old percentage owner cost links into current pct modes', () => {
    const decoded = decodeInputs('?propertyTaxIsFixed=false&propertyTaxRatePct=0.4&maintenanceCostPct=1.2')

    expect(decoded.propertyTaxMode).toBe('pct')
    expect(decoded.propertyTax).toBe(0.4)
    expect(decoded.maintenanceMode).toBe('pct')
    expect(decoded.maintenance).toBe(1.2)
  })

  it('decodes incoming PWL shared-link parameter names', () => {
    const decoded = decodeInputs(
      '?isPortfolioTaxable=TRUE&timeHorizon=12&incomeInit=80000&purchasePrice=900000&downPayment=15&ammortization=25&interestRate=4.9&propertyTaxRate=0.4&maintenanceCostPct=1.2&realEstateGrowthRate=3.1&homeInsuranceMonthlyInit=220&rentInsuranceMonthlyInit=25&rentInit=3000&assetAllocation=60&inflation=2.2&elgDividends=0.46&foreignDividends=0.56&unrealizedGains=2.99&realizedGains=0.33&income=1.33&fwtRate=15',
    )

    expect(decoded.isPortfolioTaxable).toBe(true)
    expect(decoded.timeHorizonYears).toBe(12)
    expect(decoded.annualIncome).toBe(80_000)
    expect(decoded.purchasePrice).toBe(900_000)
    expect(decoded.downPayment).toBe(15)
    expect(decoded.amortizationYears).toBe(25)
    expect(decoded.interestRatePct).toBe(4.9)
    expect(decoded.propertyTax).toBe(0.4)
    expect(decoded.maintenance).toBe(1.2)
    expect(decoded.realEstateGrowthRatePct).toBe(3.1)
    expect(decoded.homeInsurance).toBe(2640)
    expect(decoded.rentInsuranceMonthly).toBe(25)
    expect(decoded.rentMonthly).toBe(3000)
    expect(decoded.assetAllocationPct).toBe(60)
    expect(decoded.inflationPct).toBe(2.2)
    expect(decoded.eligibleDividendsPct).toBe(0.46)
    expect(decoded.foreignDividendsPct).toBe(0.56)
    expect(decoded.unrealizedGainsPct).toBe(2.99)
    expect(decoded.realizedGainsPct).toBe(0.33)
    expect(decoded.interestIncomePct).toBe(1.33)
    expect(decoded.foreignWithholdingTaxPct).toBe(15)
  })

  it('prefers local query names when both local and PWL aliases are present', () => {
    const decoded = decodeInputs('?timeHorizon=12&timeHorizonYears=8&rentInit=3000&rentMonthly=2500')

    expect(decoded.timeHorizonYears).toBe(8)
    expect(decoded.rentMonthly).toBe(2500)
  })

  it('derives return fields from a URL-loaded asset allocation when custom rows are omitted', () => {
    const decoded = decodeInputs('?assetAllocation=60&foreignDividends=9')

    expect(decoded.assetAllocationPct).toBe(60)
    expect(decoded.eligibleDividendsPct).toBe(0.46)
    expect(decoded.foreignDividendsPct).toBe(9)
    expect(decoded.unrealizedGainsPct).toBe(2.99)
    expect(decoded.realizedGainsPct).toBe(0.33)
    expect(decoded.interestIncomePct).toBe(1.33)
  })

  it('decodes valid expense-mode toggles and ignores invalid ones', () => {
    const decoded = decodeInputs('?downPaymentMode=dollar&maintenanceMode=banana')
    expect(decoded.downPaymentMode).toBe('dollar')
    expect(decoded.maintenanceMode).toBe(NZ_DEFAULTS.maintenanceMode)
  })

  it('round-trips every field through encode -> decode', () => {
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
