/**
 * Helpers for the toggleable home expenses (down payment, property tax,
 * maintenance, insurance, purchase/selling costs). Each is stored as a
 * `{ value, mode }` pair; these functions turn that pair into dollars and convert
 * between the two modes so the UI can show — and preserve — the back-calculated
 * equivalent when the user flips the toggle.
 */
import type { ExpenseMode } from '../types'

/**
 * Resolve a toggleable expense to a dollar amount.
 *  - `pct`: `value` is a percentage of `base` (e.g. 1% of the home value).
 *  - `dollar`: `value` is already a dollar amount and `base` is ignored.
 */
export function resolveAmount(mode: ExpenseMode, value: number, base: number): number {
  return mode === 'pct' ? base * (value / 100) : value
}

/**
 * Convert a value between modes against `base`, preserving the dollar amount it
 * represents. Used when the user toggles a field: 1% of $850,000 ⇄ $8,500.
 * Dollar→percentage with a zero base is undefined, so it returns 0.
 */
export function convertMode(from: ExpenseMode, to: ExpenseMode, value: number, base: number): number {
  if (from === to) return value
  if (to === 'dollar') return base * (value / 100) // pct → dollar
  return base === 0 ? 0 : (value / base) * 100 // dollar → pct
}
