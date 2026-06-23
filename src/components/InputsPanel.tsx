import type { Inputs } from '../types'
import InputField from './InputField'

type Key = keyof Inputs

interface FieldConfig {
  key: Key
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
  fields: FieldConfig[]
}

const SECTIONS: Section[] = [
  {
    title: 'Time & income',
    fields: [
      { key: 'timeHorizonYears', label: 'Time horizon', suffix: 'yrs', min: 1, max: 50, tooltip: "How long before you'd sell, i.e. the period to compare over." },
      { key: 'annualIncome', label: 'Gross annual income', prefix: '$', step: 1000, min: 0, tooltip: 'Used to show your marginal tax rate and suggest a PIR.' },
    ],
  },
  {
    title: 'The home',
    fields: [
      { key: 'purchasePrice', label: 'Purchase price', prefix: '$', step: 5000, min: 0 },
      { key: 'depositPct', label: 'Deposit', suffix: '%', step: 1, min: 0, max: 100, tooltip: 'Under 20% usually incurs a low-equity premium (not modelled).' },
      { key: 'loanTermYears', label: 'Loan term', suffix: 'yrs', step: 1, min: 1, max: 40 },
      { key: 'mortgageRatePct', label: 'Mortgage rate', suffix: '%', step: 0.1, min: 0, tooltip: 'A single fixed rate is assumed for the whole term.' },
      { key: 'houseGrowthPct', label: 'House price growth', suffix: '%', step: 0.1, tooltip: 'Long-run annual appreciation. NZ history is higher, but a conservative figure is safer.' },
    ],
  },
  {
    title: 'Ownership costs',
    fields: [
      { key: 'councilRatesPct', label: 'Council rates', suffix: '%', step: 0.05, min: 0, tooltip: "Annual council rates as a % of value — NZ's version of property tax." },
      { key: 'maintenancePct', label: 'Maintenance', suffix: '%', step: 0.1, min: 0, tooltip: "Annual upkeep as a % of the home's value." },
      { key: 'houseInsuranceMonthly', label: 'House insurance', prefix: '$', suffix: '/mo', step: 10, min: 0 },
      { key: 'bodyCorporateMonthly', label: 'Body corporate', prefix: '$', suffix: '/mo', step: 10, min: 0, tooltip: 'Apartments/units only; leave at 0 for a standalone house.' },
      { key: 'purchaseCosts', label: 'Purchase costs', prefix: '$', step: 250, min: 0, tooltip: 'Legal + building inspection. NZ has no stamp duty.' },
      { key: 'sellingCostsPct', label: 'Selling costs', suffix: '%', step: 0.1, min: 0, tooltip: 'Agent commission + legal, charged when you sell.' },
    ],
  },
  {
    title: 'Renting',
    fields: [
      { key: 'rentMonthly', label: 'Rent', prefix: '$', suffix: '/mo', step: 50, min: 0 },
      { key: 'rentGrowthPct', label: 'Rent growth', suffix: '%', step: 0.1, tooltip: 'Annual rent increases. Defaults to inflation.' },
      { key: 'contentsInsuranceMonthly', label: 'Contents insurance', prefix: '$', suffix: '/mo', step: 5, min: 0 },
    ],
  },
  {
    title: 'Investing the difference',
    fields: [
      { key: 'equityAllocationPct', label: 'Equity allocation', suffix: '%', step: 5, min: 0, max: 100, tooltip: 'Share of the portfolio in equities; the rest is bonds/cash.' },
      { key: 'equityReturnPct', label: 'Equity return', suffix: '%', step: 0.1, tooltip: 'Expected nominal return on shares, before the FIF/FDR tax drag.' },
      { key: 'bondReturnPct', label: 'Bond/cash return', suffix: '%', step: 0.1, tooltip: 'Expected nominal return on bonds/cash; interest is taxed at your PIR.' },
      { key: 'pirPct', label: 'PIR (investor tax rate)', suffix: '%', step: 1, min: 0, max: 28, tooltip: 'Prescribed Investor Rate for a PIE fund — capped at 28%. Drives the FIF/FDR tax.' },
    ],
  },
  {
    title: 'Economy',
    fields: [
      { key: 'inflationPct', label: 'Inflation', suffix: '%', step: 0.1, tooltip: 'Escalates insurance and body corporate over time.' },
    ],
  },
]

interface Props {
  inputs: Inputs
  update: <K extends Key>(key: K, value: number) => void
}

export default function InputsPanel({ inputs, update }: Props) {
  return (
    <div className="space-y-5">
      {SECTIONS.map((section) => (
        <div key={section.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{section.title}</h3>
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
