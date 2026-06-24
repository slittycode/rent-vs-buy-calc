import { useState } from 'react'
import type { SimulationResult } from '../calc/simulate'
import CashFlowChart from './CashFlowChart'
import NetWorthChart from './NetWorthChart'
import RenterSavingsChart from './RenterSavingsChart'

type ChartTab = 'netWorth' | 'cashFlow' | 'renterSavings'

const TABS: { id: ChartTab; label: string }[] = [
  { id: 'netWorth', label: 'Net Worth' },
  { id: 'cashFlow', label: 'Cash Flow' },
  { id: 'renterSavings', label: 'Renter Savings' },
]

export default function ChartTabs({ result }: { result: SimulationResult }) {
  const [activeTab, setActiveTab] = useState<ChartTab>('netWorth')
  const mortgagePaidOffYear = result.series.find((p) => p.year > 0 && p.mortgageBalance === 0)?.year ?? null

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Projection charts">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                selected
                  ? 'border-sky-600 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'netWorth' && (
        <NetWorthChart result={result} mortgagePaidOffYear={mortgagePaidOffYear} />
      )}
      {activeTab === 'cashFlow' && (
        <CashFlowChart result={result} mortgagePaidOffYear={mortgagePaidOffYear} />
      )}
      {activeTab === 'renterSavings' && (
        <RenterSavingsChart result={result} mortgagePaidOffYear={mortgagePaidOffYear} />
      )}
    </section>
  )
}
