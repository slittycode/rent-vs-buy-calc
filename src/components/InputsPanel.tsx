import type { Inputs, Location } from '../types'
import { LOCATIONS } from '../types'
import { NUMERIC_INPUT_LIMITS, type NumericInputKey } from '../inputLimits'
import InputField from './InputField'

interface FieldConfig {
  key: NumericInputKey
  label: string
  prefix?: string
  suffix?: string
  step?: number
  tooltip?: string
}

interface Section {
  title: string
  hint?: string
  fields: FieldConfig[]
}

const TOP_FIELDS: FieldConfig[] = [
  { key: 'annualIncome', label: 'Annual income', prefix: '$', step: 1000, tooltip: 'Gross income - sets your NZ marginal tax rate.' },
  { key: 'timeHorizonYears', label: 'Time horizon', suffix: 'yrs', tooltip: 'The period to compare over.' },
]

const SECTIONS: Section[] = [
  {
    title: 'Buy',
    fields: [
      { key: 'purchasePrice', label: 'Purchase price', prefix: '$', step: 5000 },
      { key: 'downPaymentPct', label: 'Down payment', suffix: '%', step: 1 },
      { key: 'amortizationYears', label: 'Mortgage term', suffix: 'yrs', step: 1, tooltip: 'The mortgage amortisation period.' },
      { key: 'interestRatePct', label: 'Interest rate', suffix: '%', step: 0.1 },
      { key: 'propertyTaxRatePct', label: 'Council rates', suffix: '%', step: 0.05, tooltip: 'Annual council rates, as a % of the home value.' },
      { key: 'maintenanceCostPct', label: 'Maintenance', suffix: '%', step: 0.1, tooltip: "Annual, as a % of the home's value." },
      { key: 'homeInsuranceMonthly', label: 'Home insurance', prefix: '$', suffix: '/mo', step: 10 },
    ],
  },
  {
    title: 'Rent',
    fields: [
      { key: 'rentMonthly', label: 'Rent', prefix: '$', suffix: '/mo', step: 50 },
      { key: 'rentInsuranceMonthly', label: 'Contents insurance', prefix: '$', suffix: '/mo', step: 5 },
    ],
  },
  {
    title: 'Expected Returns',
    hint: 'Annual return split by tax type (% of portfolio). Derived from your asset allocation, but editable. In NZ the capital-gains rows are not taxed.',
    fields: [
      { key: 'inflationPct', label: 'Inflation', suffix: '%', step: 0.1, tooltip: 'Grows rent and insurance over time.' },
      { key: 'realEstateGrowthRatePct', label: 'Real estate growth', suffix: '%', step: 0.1, tooltip: 'Expected annual house-price appreciation.' },
      { key: 'eligibleDividendsPct', label: 'NZ dividends', suffix: '%', step: 0.05, tooltip: 'Taxed at your NZ marginal rate in this simplified model.' },
      { key: 'foreignDividendsPct', label: 'Foreign dividends', suffix: '%', step: 0.05, tooltip: 'Taxed at your marginal rate; foreign withholding tax credited.' },
      { key: 'realizedGainsPct', label: 'Realised capital gains', suffix: '%', step: 0.05, tooltip: 'Not taxed in this simplified NZ model.' },
      { key: 'unrealizedGainsPct', label: 'Unrealised capital gains', suffix: '%', step: 0.05, tooltip: 'Not taxed in this simplified NZ model.' },
      { key: 'interestIncomePct', label: 'Interest income', suffix: '%', step: 0.05, tooltip: 'Taxed at your NZ marginal rate.' },
      { key: 'foreignWithholdingTaxPct', label: 'Foreign withholding tax', suffix: '%', step: 1, tooltip: 'Rate withheld at source on foreign dividends.' },
    ],
  },
]

const ASSET_ALLOCATION_PRESETS = Array.from({ length: 21 }, (_, i) => i * 5)

interface Props {
  inputs: Inputs
  update: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
}

const cardClass = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
const headingClass = 'mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500'

export default function InputsPanel({ inputs, update }: Props) {
  function renderField(f: FieldConfig) {
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
          {TOP_FIELDS.map(renderField)}
        </div>
      </div>

      {SECTIONS.map((section) => (
        <details key={section.title} className={cardClass} open>
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-500">
            {section.title}
          </summary>
          {section.hint && <p className="mt-3 text-xs text-slate-500">{section.hint}</p>}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {section.title === 'Expected Returns' && (
              <>
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
              </>
            )}
            {section.fields.map(renderField)}
          </div>
        </details>
      ))}
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
        <span
          title="Equity share of the invested portfolio; changing this resets the return mix below."
          className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600"
        >
          ?
        </span>
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
