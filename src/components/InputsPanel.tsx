import type { Inputs, Location } from '../types'
import { LOCATIONS } from '../types'
import InputField from './InputField'

// Keys of Inputs whose values are numbers (everything except location + the toggle).
type NumericKey = { [K in keyof Inputs]: Inputs[K] extends number ? K : never }[keyof Inputs]

interface FieldConfig {
  key: NumericKey
  label: string
  prefix?: string
  suffix?: string
  step?: number
  min?: number
  max?: number
  tooltip?: string
}

interface Section {
  title: string
  hint?: string
  fields: FieldConfig[]
}

const SECTIONS: Section[] = [
  {
    title: 'Time & income',
    fields: [
      { key: 'timeHorizonYears', label: 'Time horizon', suffix: 'yrs', min: 1, max: 50, tooltip: 'The period to compare over.' },
      { key: 'annualIncome', label: 'Annual income', prefix: '$', step: 1000, min: 0, tooltip: 'Gross income — sets your NZ marginal tax rate.' },
    ],
  },
  {
    title: 'Buying',
    fields: [
      { key: 'purchasePrice', label: 'Purchase price', prefix: '$', step: 5000, min: 0 },
      { key: 'downPaymentPct', label: 'Down payment', suffix: '%', step: 1, min: 0, max: 100 },
      { key: 'amortizationYears', label: 'Amortization', suffix: 'yrs', step: 1, min: 1, max: 40 },
      { key: 'interestRatePct', label: 'Interest rate', suffix: '%', step: 0.1, min: 0 },
      { key: 'propertyTaxRatePct', label: 'Property tax / rates', suffix: '%', step: 0.05, min: 0, tooltip: 'Annual, as a % of value (council rates in NZ).' },
      { key: 'maintenanceCostPct', label: 'Maintenance', suffix: '%', step: 0.1, min: 0, tooltip: "Annual, as a % of the home's value." },
      { key: 'realEstateGrowthRatePct', label: 'Real estate growth', suffix: '%', step: 0.1, tooltip: 'Expected annual house-price appreciation.' },
      { key: 'homeInsuranceMonthly', label: 'Home insurance', prefix: '$', suffix: '/mo', step: 10, min: 0 },
    ],
  },
  {
    title: 'Renting',
    fields: [
      { key: 'rentMonthly', label: 'Rent', prefix: '$', suffix: '/mo', step: 50, min: 0 },
      { key: 'rentInsuranceMonthly', label: 'Renter insurance', prefix: '$', suffix: '/mo', step: 5, min: 0 },
    ],
  },
  {
    title: 'Portfolio',
    fields: [
      { key: 'assetAllocationPct', label: 'Asset allocation (equity)', suffix: '%', step: 5, min: 0, max: 100, tooltip: 'Equity share of the invested portfolio; resets the return mix below.' },
      { key: 'inflationPct', label: 'Inflation', suffix: '%', step: 0.1, tooltip: 'Grows rent and insurance over time.' },
    ],
  },
  {
    title: 'Investment return mix',
    hint: 'Annual return split by tax type (% of portfolio). Derived from your asset allocation, but editable. In NZ the capital-gains rows are not taxed.',
    fields: [
      { key: 'eligibleDividendsPct', label: 'NZ / eligible dividends', suffix: '%', step: 0.05, min: 0, tooltip: 'Taxed at your NZ marginal rate.' },
      { key: 'foreignDividendsPct', label: 'Foreign dividends', suffix: '%', step: 0.05, min: 0, tooltip: 'Taxed at your marginal rate; foreign withholding tax credited.' },
      { key: 'realizedGainsPct', label: 'Realized capital gains', suffix: '%', step: 0.05, min: 0, tooltip: 'Not taxed in NZ (no CGT).' },
      { key: 'unrealizedGainsPct', label: 'Unrealized capital gains', suffix: '%', step: 0.05, min: 0, tooltip: 'Not taxed in NZ (no CGT).' },
      { key: 'interestIncomePct', label: 'Interest income', suffix: '%', step: 0.05, min: 0, tooltip: 'Taxed at your NZ marginal rate.' },
      { key: 'foreignWithholdingTaxPct', label: 'Foreign withholding tax', suffix: '%', step: 1, min: 0, max: 100, tooltip: 'Rate withheld at source on foreign dividends.' },
    ],
  },
]

interface Props {
  inputs: Inputs
  update: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
}

const cardClass = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
const headingClass = 'mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500'

export default function InputsPanel({ inputs, update }: Props) {
  return (
    <div className="space-y-5">
      <div className={cardClass}>
        <h3 className={headingClass}>Location & tax</h3>
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
          <label className="flex cursor-pointer items-center gap-2 self-end pb-1.5">
            <input
              type="checkbox"
              checked={inputs.isPortfolioTaxable}
              onChange={(e) => update('isPortfolioTaxable', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm font-medium text-slate-700">Portfolio in a taxable account</span>
          </label>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className={cardClass}>
          <h3 className={headingClass}>{section.title}</h3>
          {section.hint && <p className="-mt-2 mb-3 text-xs text-slate-500">{section.hint}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {section.fields.map((f) => (
              <InputField
                key={f.key}
                label={f.label}
                value={inputs[f.key]}
                onChange={(v) => update(f.key, v)}
                prefix={f.prefix}
                suffix={f.suffix}
                step={f.step}
                min={f.min}
                max={f.max}
                tooltip={f.tooltip}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
