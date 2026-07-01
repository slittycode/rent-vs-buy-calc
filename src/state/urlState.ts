import type { Inputs, Location } from '../types'
import { EXPENSE_MODES, LOCATIONS } from '../types'
import { NZ_DEFAULTS } from '../defaults'
import { presetForLocation } from '../regions'
import { clampNumericInput, type NumericInputKey } from '../inputLimits'
import { compositionForAllocation } from '../calc/portfolio'

const PWL_QUERY_ALIASES: Partial<Record<keyof Inputs, string>> = {
  timeHorizonYears: 'timeHorizon',
  annualIncome: 'incomeInit',
  amortizationYears: 'ammortization',
  interestRatePct: 'interestRate',
  propertyTax: 'propertyTaxRate',
  maintenance: 'maintenanceCostPct',
  realEstateGrowthRatePct: 'realEstateGrowthRate',
  homeInsurance: 'homeInsuranceMonthlyInit',
  rentInsuranceMonthly: 'rentInsuranceMonthlyInit',
  rentMonthly: 'rentInit',
  assetAllocationPct: 'assetAllocation',
  inflationPct: 'inflation',
  eligibleDividendsPct: 'elgDividends',
  foreignDividendsPct: 'foreignDividends',
  unrealizedGainsPct: 'unrealizedGains',
  realizedGainsPct: 'realizedGains',
  interestIncomePct: 'income',
  foreignWithholdingTaxPct: 'fwtRate',
}

const RETURN_COMPOSITION_KEYS = [
  'eligibleDividendsPct',
  'foreignDividendsPct',
  'unrealizedGainsPct',
  'realizedGainsPct',
  'interestIncomePct',
] as const

/** Encode all inputs as a readable query string (one param per field). */
export function encodeInputs(inputs: Inputs): string {
  const params = new URLSearchParams()
  for (const key of Object.keys(inputs) as (keyof Inputs)[]) {
    params.set(key, String(inputs[key]))
  }
  return params.toString()
}

const isLocation = (raw: string): raw is Inputs['location'] => (LOCATIONS as readonly string[]).includes(raw)
const isExpenseMode = (raw: string): raw is Inputs['downPaymentMode'] =>
  (EXPENSE_MODES as readonly string[]).includes(raw)

function parseBooleanQueryValue(raw: string): boolean | null {
  const normalized = raw.toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return null
}

function getQueryValue(params: URLSearchParams, key: keyof Inputs): string | null {
  const localValue = params.get(key)
  if (localValue !== null) return localValue
  const alias = PWL_QUERY_ALIASES[key]
  return alias ? params.get(alias) : null
}

function parseNumber(raw: string | null): number | null {
  if (raw === null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function setClamped(result: Inputs, key: NumericInputKey, value: number) {
  const clamped = clampNumericInput(key, value)
  Object.assign(result, { [key]: clamped })
}

function applyLegacyOwnerCostParams(params: URLSearchParams, result: Inputs) {
  const hasLocalPropertyTax = params.get('propertyTax') !== null || params.get('propertyTaxMode') !== null
  const hasLocalMaintenance = params.get('maintenance') !== null || params.get('maintenanceMode') !== null
  const hasLocalHomeInsurance = params.get('homeInsurance') !== null || params.get('homeInsuranceMode') !== null

  const legacyPropertyTaxFixed = parseBooleanQueryValue(params.get('propertyTaxIsFixed') ?? '')
  if (!hasLocalPropertyTax && legacyPropertyTaxFixed !== null) {
    result.propertyTaxMode = legacyPropertyTaxFixed ? 'dollar' : 'pct'
    const value = parseNumber(
      legacyPropertyTaxFixed ? params.get('propertyTaxAnnualFixed') : params.get('propertyTaxRatePct'),
    )
    if (value !== null) setClamped(result, 'propertyTax', value)
  } else if (!hasLocalPropertyTax) {
    const legacyRate = parseNumber(params.get('propertyTaxRatePct'))
    if (legacyRate !== null) {
      result.propertyTaxMode = 'pct'
      setClamped(result, 'propertyTax', legacyRate)
    }
  }

  const legacyMaintenanceFixed = parseBooleanQueryValue(params.get('maintenanceIsFixed') ?? '')
  if (!hasLocalMaintenance && legacyMaintenanceFixed !== null) {
    result.maintenanceMode = legacyMaintenanceFixed ? 'dollar' : 'pct'
    const value = parseNumber(
      legacyMaintenanceFixed ? params.get('maintenanceAnnualFixed') : params.get('maintenanceCostPct'),
    )
    if (value !== null) setClamped(result, 'maintenance', value)
  } else if (!hasLocalMaintenance) {
    const legacyRate = parseNumber(params.get('maintenanceCostPct'))
    if (legacyRate !== null) {
      result.maintenanceMode = 'pct'
      setClamped(result, 'maintenance', legacyRate)
    }
  }

  const legacyHomeInsuranceMonthly =
    parseNumber(params.get('homeInsuranceMonthly')) ?? parseNumber(params.get('homeInsuranceMonthlyInit'))
  if (!hasLocalHomeInsurance && legacyHomeInsuranceMonthly !== null) {
    result.homeInsuranceMode = 'dollar'
    setClamped(result, 'homeInsurance', legacyHomeInsuranceMonthly * 12)
  }
}

/** Decode inputs from a query string, falling back to NZ defaults for anything missing or invalid. */
export function decodeInputs(search: string): Inputs {
  const params = new URLSearchParams(search)

  // Resolve location first, then seed the market-specific fields from its preset so a
  // bare `?location=Auckland` link shows Auckland's market. Explicit params still win below.
  const locRaw = params.get('location')
  const location: Location = locRaw && LOCATIONS.includes(locRaw as Location) ? (locRaw as Location) : 'New Zealand'
  const result: Inputs = { ...NZ_DEFAULTS, ...presetForLocation(location), location }

  for (const key of Object.keys(NZ_DEFAULTS) as (keyof Inputs)[]) {
    const raw = getQueryValue(params, key)
    if (raw === null) continue
    const def = NZ_DEFAULTS[key]
    if (typeof def === 'number') {
      const n = Number(raw)
      if (Number.isFinite(n)) {
        const value = key === 'homeInsurance' && params.get('homeInsurance') === null ? n * 12 : n
        Object.assign(result, { [key]: clampNumericInput(key as NumericInputKey, value) })
      }
    } else if (typeof def === 'boolean') {
      const parsed = parseBooleanQueryValue(raw)
      if (parsed !== null) (result[key] as boolean) = parsed
    } else if (def === 'pct' || def === 'dollar') {
      if (isExpenseMode(raw)) (result[key] as Inputs['downPaymentMode']) = raw
    } else if (isLocation(raw)) {
      Object.assign(result, { [key]: raw })
    }
  }

  applyLegacyOwnerCostParams(params, result)

  if (getQueryValue(params, 'assetAllocationPct') !== null) {
    const composition = compositionForAllocation(result.assetAllocationPct)
    for (const key of RETURN_COMPOSITION_KEYS) {
      if (getQueryValue(params, key) === null) result[key] = composition[key]
    }
  }

  return result
}
