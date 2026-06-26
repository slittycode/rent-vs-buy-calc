import type { Inputs, Location } from './types'

/**
 * Per-location market data. Selecting a location in the UI fills these five fields
 * with the local market's figures; everything else (income, deposit, rate, term,
 * portfolio mix, tax) is unchanged.
 *
 * SOURCES & METHODOLOGY  (data vintage: late 2025 / 2025-26 rating year)
 * ---------------------------------------------------------------------------
 * purchasePrice        REINZ regional MEDIAN sale price, November 2025 NZ Property
 *                      Report (reinz.co.nz). Queenstown-Lakes is a district inside
 *                      Otago, not a REINZ region, so it uses the QV median dwelling
 *                      value from the March 2025 revaluation (~$1.61m).
 *
 * rentMonthly          MEDIAN weekly rent → monthly via round(weekly × 52 / 12).
 *                      Weekly figures from MBIE Tenancy Services bond-lodgement data
 *                      and Realestate.co.nz regional reports (2025). Smaller regions
 *                      (Northland, Gisborne, Hawke's Bay, Taranaki, Manawatū-
 *                      Whanganui, Marlborough) are approximate — confirm against the
 *                      MBIE market-rent tool before treating as exact.
 *
 * propertyTaxRatePct   Council rates as an EFFECTIVE % of the median price =
 *                      (representative council average residential rates bill) ÷
 *                      (region median price). Metro bills (Auckland $4,069, Wellington
 *                      $5,094, Christchurch $4,212, Queenstown-Lakes $4,848) from the
 *                      Taxpayers' Union Ratepayers' Report 2025/26; provincial bills
 *                      estimated at ~$3,000–$3,600. This is more representative than a
 *                      flat national rate but the provincial figures are estimates.
 *
 * homeInsuranceMonthly ESTIMATE, not a quote. Base $250/mo, with an uplift for
 *                      natural-hazard exposure: highest seismic (Wellington,
 *                      Marlborough) $340; elevated EQ/coastal/flood (Canterbury,
 *                      Gisborne, Hawke's Bay) $300; higher sums-insured / coastal
 *                      (Auckland, Bay of Plenty, Tasman, Nelson, Queenstown-Lakes)
 *                      $280; remainder at base. Reflects increasingly risk-priced NZ
 *                      premiums (ICNZ/EQC commentary) without being an insurer quote.
 *
 * realEstateGrowthRatePct  Long-run (~15–20yr) nominal house-price growth, tempered
 *                      toward the 3.5% national assumption to avoid over-fitting recent
 *                      cycles (band ≈ 2.5–4.0%). A forward-looking assumption, not data.
 *
 * Every figure is editable in the UI after selection — these are starting points.
 */
export type RegionPreset = Pick<
  Inputs,
  'purchasePrice' | 'rentMonthly' | 'propertyTaxRatePct' | 'homeInsuranceMonthly' | 'realEstateGrowthRatePct'
>

/** weekly rent → whole-dollar monthly rent */
const rent = (weekly: number): number => Math.round((weekly * 52) / 12)

export const REGION_PRESETS: Record<Location, RegionPreset> = {
  // National default — the existing neutral starting scenario, left unchanged.
  // (Real MBIE national median is ~$625/wk ≈ $2,708/mo and the REINZ national median is
  // ~$808k; this default keeps the prior round-number scenario. Swap in those figures if a
  // data-true national baseline is preferred.)
  'New Zealand': { purchasePrice: 850_000, rentMonthly: 2_833, propertyTaxRatePct: 0.3, homeInsuranceMonthly: 250, realEstateGrowthRatePct: 3.5 },

  Northland: { purchasePrice: 680_000, rentMonthly: rent(560), propertyTaxRatePct: 0.5, homeInsuranceMonthly: 250, realEstateGrowthRatePct: 3.3 },
  Auckland: { purchasePrice: 1_050_000, rentMonthly: rent(650), propertyTaxRatePct: 0.39, homeInsuranceMonthly: 280, realEstateGrowthRatePct: 3.5 },
  Waikato: { purchasePrice: 770_000, rentMonthly: rent(575), propertyTaxRatePct: 0.44, homeInsuranceMonthly: 250, realEstateGrowthRatePct: 3.6 },
  'Bay of Plenty': { purchasePrice: 855_000, rentMonthly: rent(640), propertyTaxRatePct: 0.42, homeInsuranceMonthly: 280, realEstateGrowthRatePct: 3.8 },
  Gisborne: { purchasePrice: 700_000, rentMonthly: rent(580), propertyTaxRatePct: 0.46, homeInsuranceMonthly: 300, realEstateGrowthRatePct: 3.3 },
  "Hawke's Bay": { purchasePrice: 700_000, rentMonthly: rent(600), propertyTaxRatePct: 0.5, homeInsuranceMonthly: 300, realEstateGrowthRatePct: 3.3 },
  Taranaki: { purchasePrice: 620_000, rentMonthly: rent(560), propertyTaxRatePct: 0.53, homeInsuranceMonthly: 250, realEstateGrowthRatePct: 3.0 },
  'Manawatū-Whanganui': { purchasePrice: 540_000, rentMonthly: rent(530), propertyTaxRatePct: 0.61, homeInsuranceMonthly: 250, realEstateGrowthRatePct: 3.2 },
  Wellington: { purchasePrice: 790_000, rentMonthly: rent(600), propertyTaxRatePct: 0.64, homeInsuranceMonthly: 340, realEstateGrowthRatePct: 3.3 },
  Tasman: { purchasePrice: 780_000, rentMonthly: rent(590), propertyTaxRatePct: 0.46, homeInsuranceMonthly: 280, realEstateGrowthRatePct: 3.5 },
  Nelson: { purchasePrice: 745_000, rentMonthly: rent(590), propertyTaxRatePct: 0.46, homeInsuranceMonthly: 280, realEstateGrowthRatePct: 3.5 },
  Marlborough: { purchasePrice: 749_000, rentMonthly: rent(560), propertyTaxRatePct: 0.44, homeInsuranceMonthly: 340, realEstateGrowthRatePct: 3.3 },
  'West Coast': { purchasePrice: 395_000, rentMonthly: rent(405), propertyTaxRatePct: 0.76, homeInsuranceMonthly: 250, realEstateGrowthRatePct: 2.5 },
  Canterbury: { purchasePrice: 720_000, rentMonthly: rent(570), propertyTaxRatePct: 0.59, homeInsuranceMonthly: 300, realEstateGrowthRatePct: 3.5 },
  Otago: { purchasePrice: 625_000, rentMonthly: rent(520), propertyTaxRatePct: 0.51, homeInsuranceMonthly: 250, realEstateGrowthRatePct: 3.5 },
  'Queenstown-Lakes': { purchasePrice: 1_610_000, rentMonthly: rent(750), propertyTaxRatePct: 0.3, homeInsuranceMonthly: 280, realEstateGrowthRatePct: 4.0 },
  Southland: { purchasePrice: 505_000, rentMonthly: rent(475), propertyTaxRatePct: 0.59, homeInsuranceMonthly: 250, realEstateGrowthRatePct: 3.0 },
}

/** Market-data preset for a location, defaulting to the national scenario. */
export function presetForLocation(location: Location): RegionPreset {
  return REGION_PRESETS[location] ?? REGION_PRESETS['New Zealand']
}
