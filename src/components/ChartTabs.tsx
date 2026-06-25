import { type ReactNode, useState } from 'react'
import type { SimulationResult } from '../calc/simulate'
import CashFlowChart from './CashFlowChart'
import NetWorthChart from './NetWorthChart'
import RenterSavingsChart from './RenterSavingsChart'

type ChartTab = 'netWorth' | 'cashFlow' | 'renterSavings'

const TABS: { id: ChartTab; label: string; icon: ReactNode }[] = [
  { id: 'netWorth', label: 'Net Worth', icon: <TrendingUpIcon /> },
  { id: 'cashFlow', label: 'Cash Flow', icon: <BanknotesIcon /> },
  { id: 'renterSavings', label: 'Renter Savings', icon: <PiggyBankIcon /> },
]

export default function ChartTabs({ result }: { result: SimulationResult }) {
  const [activeTab, setActiveTab] = useState<ChartTab>('netWorth')
  const mortgagePaidOffYear = result.series.find((p) => p.year > 0 && p.mortgageBalance === 0)?.year ?? null

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-6" role="tablist" aria-label="Projection charts">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-1 pb-2 pt-1 text-sm font-semibold transition-colors ${
                selected
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
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

function TrendingUpIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  )
}

function BanknotesIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9h1.5M16.5 15H18" />
    </svg>
  )
}

function PiggyBankIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 11a6 6 0 0 1 6-5h4a5 5 0 0 1 5 5v3" />
      <path d="M5 11H3v4h3a6 6 0 0 0 5 3h5a5 5 0 0 0 5-5" />
      <path d="M8 18v2M17 18v2M10 9h5M18 9h.01" />
    </svg>
  )
}
