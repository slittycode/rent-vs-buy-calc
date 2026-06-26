import { describe, it, expect } from 'vitest'
import { resolveAmount, convertMode } from './expenses'

describe('resolveAmount', () => {
  it('treats pct mode as a percentage of the base', () => {
    expect(resolveAmount('pct', 1, 850_000)).toBeCloseTo(8_500, 6)
    expect(resolveAmount('pct', 20, 850_000)).toBeCloseTo(170_000, 6)
  })

  it('treats dollar mode as a literal amount, ignoring the base', () => {
    expect(resolveAmount('dollar', 8_500, 850_000)).toBe(8_500)
    expect(resolveAmount('dollar', 8_500, 0)).toBe(8_500)
  })

  it('handles a zero base in pct mode', () => {
    expect(resolveAmount('pct', 5, 0)).toBe(0)
  })
})

describe('convertMode (back-calculation when toggling)', () => {
  it('is a no-op when the mode is unchanged', () => {
    expect(convertMode('pct', 'pct', 20, 850_000)).toBe(20)
    expect(convertMode('dollar', 'dollar', 8_500, 850_000)).toBe(8_500)
  })

  it('converts pct → dollar preserving the resolved amount', () => {
    expect(convertMode('pct', 'dollar', 20, 850_000)).toBeCloseTo(170_000, 6)
  })

  it('converts dollar → pct preserving the resolved amount', () => {
    expect(convertMode('dollar', 'pct', 170_000, 850_000)).toBeCloseTo(20, 6)
  })

  it('round-trips a value back to itself', () => {
    const asDollar = convertMode('pct', 'dollar', 1, 850_000)
    expect(convertMode('dollar', 'pct', asDollar, 850_000)).toBeCloseTo(1, 6)
  })

  it('returns 0 for dollar → pct with a zero base instead of dividing by zero', () => {
    expect(convertMode('dollar', 'pct', 8_500, 0)).toBe(0)
  })
})
