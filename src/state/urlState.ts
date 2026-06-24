import type { Inputs } from '../types'
import { NZ_DEFAULTS } from '../defaults'

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
      if (Number.isFinite(n)) (result[key] as number) = n
    } else if (typeof def === 'boolean') {
      ;(result[key] as boolean) = raw === 'true'
    } else {
      ;(result[key] as string) = raw
    }
  }
  return result
}
