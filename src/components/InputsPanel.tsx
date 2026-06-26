import type { ExpenseMode, Inputs, Location } from '../types'
import { LOCATIONS } from '../types'
import { NUMERIC_INPUT_LIMITS, type NumericInputKey } from '../inputLimits'
import InputField from './InputField'
import ToggleableField from './ToggleableField'
import InfoTooltip from './InfoTooltip'

interface PlainConfig {
  key: NumericInputKey
  label: string
  prefix?: string
  suffix?: string
  step?: number
  tooltip?: string
}

interface ToggleConfig {
  valueKey: NumericInputKey
  modeKey: keyof Inputs
  label: string
  periodLabel?: string
  tooltip?: string
  pctStep?: number
  dollarStep?: number
  pctMax?: number
}

const TOP_FIELDS: PlainConfig[] = [
  { key: 'annualIncome', label: 'Annual income', prefix: '$', step: 1000, tooltip: 'Gross income - sets your NZ marginal tax rate.' },
  { key: 'timeHorizonYears', label: 'Time horizon', suffix: 'yrs', tooltip: 'The period to compare over.' },
]

const BUY_TOGGLES: Record<string, ToggleConfig> = {
  downPayment: {
    valueKey: 'downPayment',
    modeKey: 'downPaymentMode',
    label: 'Deposit',
    tooltip: 'Up-front deposit, as a % of the price or a fixed $ amount.',
    pctStep: 1,
    dollarStep: 5000,
    pctMax: 100,
  },
  purchaseCosts: {
    valueKey: 'purchaseCosts',
    modeKey: 'purchaseCostsMode',
    label: 'Buying costs',
    tooltip: 'One-off costs to buy: legal, LIM, building report. NZ has no stamp duty.',
    pctStep: 0.1,
    dollarStep: 500,
  },
  sellingCosts: {
    valueKey: 'sellingCosts',
    modeKey: 'sellingCostsMode',
    label: 'Selling costs',
    tooltip: 'Costs to sell at the end of the horizon: agent commission plus legal.',
    pctStep: 0.1,
    dollarStep: 1000,
  },
  propertyTax: {
    valueKey: 'propertyTax',
    modeKey: 'propertyTaxMode',
    label: 'Council rates',
    periodLabel: '/yr',
    tooltip: 'Annual council rates: a % of the home value, or a fixed $/yr.',
    pctStep: 0.05,
    dollarStep: 250,
  },
  maintenance: {
    valueKey: 'maintenance',
    modeKey: 'maintenanceMode',
    label: 'Maintenance',
    periodLabel: '/yr',
    tooltip: 'Annual upkeep: a % of the home value, or a fixed $/yr.',
    pctStep: 0.1,
    dollarStep: 250,
  },
  homeInsurance: {
    valueKey: 'homeInsurance',
    modeKey: 'homeInsuranceMode',
    label: 'Home insurance',
    periodLabel: '/yr',
    tooltip: 'Annual house insurance: a fixed $/yr, or a % of the home value.',
    pctStep: 0.05,
    dollarStep: 250,
  },
}

const BUY_PLAIN: Record<string, PlainConfig> = {
  purchasePrice: { key: 'purchasePrice', label: 'Purchase price', prefix: '$', step: 5000 },
  interestRatePct: { key: 'interestRatePct', label: 'Interest rate', suffix: '%', step: 0.1 },
  amortizationYears: { key: 'amortizationYears', label: 'Mortgage term', suffix: 'yrs', step: 1, tooltip: 'The mortgage amortisation period.' },
  otherHomeCostsMonthly: { key: 'otherHomeCostsMonthly', label: 'Body corp / other', prefix: '$', suffix: '/mo', step: 10, tooltip: 'Fixed monthly home costs such as body corporate or HOA fees.' },
  realEstateGrowthRatePct: { key: 'realEstateGrowthRatePct', label: 'Home price growth', suffix: '%', step: 0.1, tooltip: 'Expected annual house-price appreciation.' },
}

const RENT_FIELDS: PlainConfig[] = [
  { key: 'rentMonthly', label: 'Rent', prefix: '$', suffix: '/mo', step: 50 },
  { key: 'rentInsuranceMonthly', label: 'Contents insurance', prefix: '$', suffix: '/mo', step: 5 },
  { key: 'rentGrowthPct', label: 'Rent growth', suffix: '%', step: 0.1, tooltip: 'Annual rent increase, independent of general inflation.' },
]

const RETURN_FIELDS: PlainConfig[] = [
  { key: 'inflationPct', label: 'Inflation', suffix: '%', step: 0.1, tooltip: 'General inflation; escalates fixed-dollar costs over time.' },
  { key: 'investmentFeePct', label: 'Investment fee (MER)', suffix: '%', step: 0.05, tooltip: 'Annual fund/management fee; a drag on portfolio returns.' },
  { key: 'eligibleDividendsPct', label: 'NZ dividends', suffix: '%', step: 0.05, tooltip: 'Taxed at your NZ marginal rate in this simplified model.' },
  { key: 'foreignDividendsPct', label: 'Foreign dividends', suffix: '%', step: 0.05, tooltip: 'Taxed at your marginal rate; foreign withholding tax credited.' },
  { key: 'realizedGainsPct', label: 'Realised capital gains', suffix: '%', step: 0.05, tooltip: 'Not taxed in this simplified NZ model.' },
  { key: 'unrealizedGainsPct', label: 'Unrealised capital gains', suffix: '%', step: 0.05, tooltip: 'Not taxed in this simplified NZ model.' },
  { key: 'interestIncomePct', label: 'Interest income', suffix: '%', step: 0.05, tooltip: 'Taxed at your NZ marginal rate.' },
  { key: 'foreignWithholdingTaxPct', label: 'Foreign withholding tax', suffix: '%', step: 1, tooltip: 'Rate withheld at source on foreign dividends.' },
]

const ASSET_ALLOCATION_PRESETS = Array.from({ length: 21 }, (_, i) => i * 5)

interface Props {
  inputs: Inputs
  update: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
  updateMany: (patch: Partial<Inputs>) => void
}

const cardClass = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
const headingClass = 'mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500'
const sectionSummaryClass = 'cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-500'
const gridClass = 'mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'

export default function InputsPanel({ inputs, update, updateMany }: Props) {
  function plain(f: PlainConfig) {
    const limits = NUMERIC_INPUT_LIMITS[f.key]
    return (
      <InputField
        key={f.key}
        label={f.label}
        value={inputs[f.key]}
        onChange={(v) => update(f.key, v)}
        prefix={f.prefix}
        suffix={f.suffix}
        step={f.step}
        min={limits.min}
        max={limits.max}
        tooltip={f.tooltip}
      />
    )
  }

  function toggle(c: ToggleConfig) {
    return (
      <ToggleableField
        key={c.valueKey}
        label={c.label}
        value={inputs[c.valueKey]}
        mode={inputs[c.modeKey] as ExpenseMode}
        base={inputs.purchasePrice}
        periodLabel={c.periodLabel}
        tooltip={c.tooltip}
        pctStep={c.pctStep}
        dollarStep={c.dollarStep}
        pctMax={c.pctMax}
        onChange={(value, mode) => updateMany({ [c.valueKey]: value, [c.modeKey]: mode } as Partial<Inputs>)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <h3 className={headingClass}>Assumptions</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Location</span>
            <select
              value={inputs.location}
              onChange={(e) => update('location', e.target.value as Location)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {TOP_FIELDS.map(plain)}
        </div>
      </div>

      <details className={cardClass} open>
        <summary className={sectionSummaryClass}>Buy</summary>
        <div className={gridClass}>
          {plain(BUY_PLAIN.purchasePrice)}
          {toggle(BUY_TOGGLES.downPayment)}
          {plain(BUY_PLAIN.interestRatePct)}
          {plain(BUY_PLAIN.amortizationYears)}
          {toggle(BUY_TOGGLES.purchaseCosts)}
          {toggle(BUY_TOGGLES.sellingCosts)}
          {toggle(BUY_TOGGLES.propertyTax)}
          {toggle(BUY_TOGGLES.maintenance)}
          {toggle(BUY_TOGGLES.homeInsurance)}
          {plain(BUY_PLAIN.otherHomeCostsMonthly)}
          {plain(BUY_PLAIN.realEstateGrowthRatePct)}
        </div>
      </details>

      <details className={cardClass} open>
        <summary className={sectionSummaryClass}>Rent</summary>
        <div className={gridClass}>{RENT_FIELDS.map(plain)}</div>
      </details>

      <details className={cardClass} open>
        <summary className={sectionSummaryClass}>Expected Returns</summary>
        <p className="mt-3 text-xs text-slate-500">
          Annual return split by tax type (% of portfolio). Derived from your asset allocation, but editable. In NZ the
          capital-gains rows are not taxed.
        </p>
        <div className={gridClass}>
          <label className="flex cursor-pointer items-center gap-2 self-end pb-1.5">
            <input
              type="checkbox"
              checked={inputs.isPortfolioTaxable}
              onChange={(e) => update('isPortfolioTaxable', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm font-medium text-slate-700">Portfolio in a taxable account</span>
          </label>
          <AssetAllocationSelect value={inputs.assetAllocationPct} onChange={(v) => update('assetAllocationPct', v)} />
          {RETURN_FIELDS.map(plain)}
        </div>
      </details>
    </div>
  )
}

function AssetAllocationSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const hasPreset = ASSET_ALLOCATION_PRESETS.includes(value)
  const options = hasPreset ? ASSET_ALLOCATION_PRESETS : [...ASSET_ALLOCATION_PRESETS, value].sort((a, b) => a - b)

  return (
    <label className="block">
      <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
        Asset allocation (equity)
        <InfoTooltip text="Equity share of the invested portfolio; changing this resets the return mix below." />
      </span>
      <select
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        {options.map((n) => (
          <option key={n} value={String(n)}>
            {n}% equity{!ASSET_ALLOCATION_PRESETS.includes(n) ? ' (custom)' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
