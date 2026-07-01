import type { Inputs, Location } from '../types'
import { LOCATIONS, EXPENSE_MODES } from '../types'
import { NZ_DEFAULTS } from '../defaults'
import { presetForLocation } from '../regions'
import { clampNumericInput, type NumericInputKey } from '../inputLimits'

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

/** Decode inputs from a query string, falling back to NZ defaults for anything missing or invalid. */
export function decodeInputs(search: string): Inputs {
  const params = new URLSearchParams(search)

  // Resolve location first, then seed the market-specific fields from its preset so a
  // bare `?location=Auckland` link shows Auckland's market. Explicit params still win below.
  const locRaw = params.get('location')
  const location: Location = locRaw && LOCATIONS.includes(locRaw as Location) ? (locRaw as Location) : 'New Zealand'
  const result: Inputs = { ...NZ_DEFAULTS, ...presetForLocation(location), location }

  for (const key of Object.keys(NZ_DEFAULTS) as (keyof Inputs)[]) {
    const raw = params.get(key)
    if (raw === null) continue
    const def = NZ_DEFAULTS[key]
    if (typeof def === 'number') {
      const n = Number(raw)
      if (Number.isFinite(n)) (result[key] as number) = clampNumericInput(key as NumericInputKey, n)
    } else if (typeof def === 'boolean') {
      if (raw === 'true' || raw === 'false') (result[key] as boolean) = raw === 'true'
    } else if (def === 'pct' || def === 'dollar') {
      // A toggleable-expense mode field.
      if (isExpenseMode(raw)) (result[key] as Inputs['downPaymentMode']) = raw
    } else {
      // The location string field.
      if (isLocation(raw)) (result[key] as Inputs['location']) = raw
    }
  }
  return result
}
