import { describe, expect, it } from 'vitest'
import { LOCATIONS } from './types'
import { NZ_DEFAULTS } from './defaults'
import { REGION_PRESETS, presetForLocation, type RegionPreset } from './regions'
import { clampNumericInput } from './inputLimits'

const PRESET_KEYS: (keyof RegionPreset)[] = [
  'purchasePrice',
  'rentMonthly',
  'propertyTax',
  'homeInsurance',
  'realEstateGrowthRatePct',
]

describe('region presets', () => {
  it('lists locations without duplicates', () => {
    expect(new Set(LOCATIONS).size).toBe(LOCATIONS.length)
  })

  it('has a preset for every location', () => {
    for (const location of LOCATIONS) {
      expect(REGION_PRESETS[location], location).toBeDefined()
    }
  })

  it('the national preset matches the default scenario', () => {
    for (const key of PRESET_KEYS) {
      expect(REGION_PRESETS['New Zealand'][key], key).toBe(NZ_DEFAULTS[key])
    }
  })

  it.each(LOCATIONS)('%s has sane, in-range market data', (location) => {
    const preset = presetForLocation(location)

    expect(preset.purchasePrice).toBeGreaterThan(0)
    expect(preset.rentMonthly).toBeGreaterThan(0)
    expect(preset.propertyTax).toBeGreaterThanOrEqual(0)
    expect(preset.homeInsurance).toBeGreaterThan(0)
    expect(preset.realEstateGrowthRatePct).toBeGreaterThan(0)

    // Every numeric value already satisfies the same limits the UI/URL layer enforces.
    for (const key of PRESET_KEYS) {
      expect(clampNumericInput(key, preset[key]), key).toBe(preset[key])
    }
  })
})
