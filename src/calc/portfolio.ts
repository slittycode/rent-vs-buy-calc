/**
 * Couples the asset-allocation input to the return-composition fields the same
 * way PWL's tool does: the equity/bond split determines how the expected return
 * breaks down by tax character. PWL ships these as 5-point presets; custom URL
 * values are linearly interpolated between the neighbouring presets.
 */

export interface Composition {
  eligibleDividendsPct: number
  foreignDividendsPct: number
  realizedGainsPct: number
  unrealizedGainsPct: number
  interestIncomePct: number
}

function preset(
  eligibleDividendsPct: number,
  foreignDividendsPct: number,
  realizedGainsPct: number,
  unrealizedGainsPct: number,
  interestIncomePct: number,
): Composition {
  return { eligibleDividendsPct, foreignDividendsPct, realizedGainsPct, unrealizedGainsPct, interestIncomePct }
}

const PWL_ALLOCATION_PRESETS: Record<number, Composition> = {
  0: preset(0, 0, 0.02, 0.2, 3.33),
  5: preset(0.04, 0.05, 0.05, 0.44, 3.16),
  10: preset(0.08, 0.09, 0.07, 0.68, 3),
  15: preset(0.12, 0.14, 0.1, 0.92, 2.83),
  20: preset(0.16, 0.19, 0.13, 1.16, 2.66),
  25: preset(0.2, 0.24, 0.15, 1.39, 2.5),
  30: preset(0.24, 0.28, 0.18, 1.63, 2.33),
  35: preset(0.27, 0.33, 0.21, 1.86, 2.16),
  40: preset(0.31, 0.38, 0.23, 2.09, 2),
  45: preset(0.35, 0.42, 0.26, 2.32, 1.83),
  50: preset(0.39, 0.47, 0.28, 2.55, 1.67),
  55: preset(0.42, 0.52, 0.31, 2.77, 1.5),
  60: preset(0.46, 0.56, 0.33, 2.99, 1.33),
  65: preset(0.5, 0.61, 0.36, 3.21, 1.17),
  70: preset(0.53, 0.66, 0.38, 3.43, 1),
  75: preset(0.57, 0.71, 0.41, 3.64, 0.83),
  80: preset(0.6, 0.75, 0.43, 3.85, 0.67),
  85: preset(0.64, 0.8, 0.45, 4.06, 0.5),
  90: preset(0.67, 0.85, 0.48, 4.27, 0.33),
  95: preset(0.71, 0.89, 0.5, 4.47, 0.17),
  100: preset(0.74, 0.94, 0.52, 4.67, 0),
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Return composition implied by an equity allocation (rounded for display). */
export function compositionForAllocation(allocationPct: number): Composition {
  const allocation = Math.min(100, Math.max(0, allocationPct))
  const exact = PWL_ALLOCATION_PRESETS[allocation]
  if (exact) return { ...exact }

  const lower = Math.floor(allocation / 5) * 5
  const upper = Math.ceil(allocation / 5) * 5
  const lowerPreset = PWL_ALLOCATION_PRESETS[lower]
  const upperPreset = PWL_ALLOCATION_PRESETS[upper]
  const weight = (allocation - lower) / (upper - lower)

  const interpolate = (key: keyof Composition) =>
    round2(lowerPreset[key] + (upperPreset[key] - lowerPreset[key]) * weight)

  return {
    eligibleDividendsPct: interpolate('eligibleDividendsPct'),
    foreignDividendsPct: interpolate('foreignDividendsPct'),
    realizedGainsPct: interpolate('realizedGainsPct'),
    unrealizedGainsPct: interpolate('unrealizedGainsPct'),
    interestIncomePct: interpolate('interestIncomePct'),
  }
}
