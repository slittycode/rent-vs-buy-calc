import { useEffect, useMemo, useState } from 'react'
import type { Inputs } from './types'
import { NZ_DEFAULTS } from './defaults'
import { simulate } from './calc/simulate'
import { marginalRate } from './calc/tax'
import { compositionForAllocation } from './calc/portfolio'
import { decodeInputs, encodeInputs } from './state/urlState'
import InputsPanel from './components/InputsPanel'
import ResultsSummary from './components/ResultsSummary'
import NetWorthChart from './components/NetWorthChart'
import CostBreakdown from './components/CostBreakdown'
import AssumptionsNote from './components/AssumptionsNote'

export default function App() {
  const [inputs, setInputs] = useState<Inputs>(() => decodeInputs(window.location.search))
  const [copied, setCopied] = useState(false)

  // Mirror inputs into the URL so a scenario is a shareable link.
  useEffect(() => {
    const id = setTimeout(() => {
      const qs = encodeInputs(inputs)
      window.history.replaceState(null, '', `${window.location.pathname}?${qs}`)
    }, 250)
    return () => clearTimeout(id)
  }, [inputs])

  const result = useMemo(() => simulate(inputs), [inputs])

  function update<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs((prev) => {
      // Changing the asset allocation resets the return-composition fields to match.
      if (key === 'assetAllocationPct') {
        return { ...prev, assetAllocationPct: value as number, ...compositionForAllocation(value as number) }
      }
      return { ...prev, [key]: value }
    })
  }

  function reset() {
    setInputs(NZ_DEFAULTS)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <h1 className="text-xl font-bold sm:text-2xl">Rent vs Buy — New Zealand</h1>
          <p className="mt-1 text-sm text-slate-600">
            The PWL Capital rent-vs-buy calculator, localised for New Zealand tax.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="order-2 lg:order-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your scenario</h2>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button
                onClick={reset}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>
          <InputsPanel inputs={inputs} update={update} />
        </section>

        <section className="order-1 space-y-5 lg:order-2">
          <ResultsSummary result={result} horizon={inputs.timeHorizonYears} />
          <NetWorthChart result={result} />
          <CostBreakdown b={result.firstMonth} />
          <AssumptionsNote
            marginalRatePct={marginalRate(inputs.annualIncome) * 100}
            isPortfolioTaxable={inputs.isPortfolioTaxable}
          />
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        Educational tool — not financial advice. NZ tax rules are simplified; check with a professional before deciding.
      </footer>
    </div>
  )
}
