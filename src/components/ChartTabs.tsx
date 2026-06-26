import { useState } from 'react'
import type { ReactNode } from 'react'
import type { SimulationResult } from '../calc/simulate'
import CashFlowChart from './CashFlowChart'
import NetWorthChart from './NetWorthChart'
import RenterSavingsChart from './RenterSavingsChart'

type ChartTab = 'netWorth' | 'cashFlow' | 'renterSavings'

const TrendingUpIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <polyline
      points="1,11 5,6.5 8.5,8.5 14,2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="10,2.5 14,2.5 14,6.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const BanknotesIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <rect x="1" y="4" width="13" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
    <line x1="3.5" y1="7.5" x2="3.5" y2="7.51" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="11.5" y1="7.5" x2="11.5" y2="7.51" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const PiggyBankIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path
      d="M6.5 3C4 3 2 5 2 7.5C2 9.2 2.9 10.7 4.3 11.6L4 13H6V12.4C6.3 12.5 6.6 12.5 7 12.5C7.4 12.5 7.7 12.4 8 12.4V13H10L9.7 11.6C11.1 10.7 12 9.2 12 7.5H13C13 7.5 13 5.5 11.5 5.5C11 4.5 9 3 6.5 3Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <circle cx="8.5" cy="6.5" r="0.7" fill="currentColor" />
    <line x1="6" y1="1.5" x2="8" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

interface TabDef {
  id: ChartTab
  label: string
  icon: ReactNode
}

const TABS: TabDef[] = [
  { id: 'netWorth', label: 'Net Worth', icon: <TrendingUpIcon /> },
  { id: 'cashFlow', label: 'Cash Flow', icon: <BanknotesIcon /> },
  { id: 'renterSavings', label: 'Renter Savings', icon: <PiggyBankIcon /> },
]

export default function ChartTabs({ result }: { result: SimulationResult }) {
  const [activeTab, setActiveTab] = useState<ChartTab>('netWorth')

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className="mb-4 flex gap-1 border-b border-slate-200"
        role="tablist"
        aria-label="Projection charts"
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${
                selected
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'netWorth' && (
        <NetWorthChart result={result} mortgagePaidOffYear={result.mortgagePaidOffYear} />
      )}
      {activeTab === 'cashFlow' && (
        <CashFlowChart result={result} mortgagePaidOffYear={result.mortgagePaidOffYear} />
      )}
      {activeTab === 'renterSavings' && (
        <RenterSavingsChart result={result} mortgagePaidOffYear={result.mortgagePaidOffYear} />
      )}
    </section>
  )
}
