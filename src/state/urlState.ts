import type { Inputs } from '../types'
import { LOCATIONS } from '../types'
import { NZ_DEFAULTS } from '../defaults'
import { clampNumericInput, type NumericInputKey } from '../inputLimits'

/** Encode all inputs as a readable query string (one param per field). */
export function encodeInputs(inputs: Inputs): string {
  const params = new URLSearchParams()
  for (const key of Object.keys(inputs) as (keyof Inputs)[]) {
    params.set(key, String(inputs[key]))
  }
  return params.toString()
}

/** Decode inputs from a query string, falling back to NZ defaults for anything missing or invalid. */
export function decodeInputs(search: string): Inputs {
  const params = new URLSearchParams(search)
  const result = { ...NZ_DEFAULTS }
  for (const key of Object.keys(NZ_DEFAULTS) as (keyof Inputs)[]) {
    const raw = params.get(key)
    if (raw === null) continue
    const def = NZ_DEFAULTS[key]
    if (typeof def === 'number') {
      const n = Number(raw)
      if (Number.isFinite(n)) (result[key] as number) = clampNumericInput(key as NumericInputKey, n)
    } else if (typeof def === 'boolean') {
      if (raw === 'true' || raw === 'false') (result[key] as boolean) = raw === 'true'
    } else {
      if (LOCATIONS.includes(raw as Inputs['location'])) (result[key] as string) = raw
    }
  }
  return result
}
