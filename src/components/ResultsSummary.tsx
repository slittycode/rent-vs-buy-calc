import type { SimulationResult } from '../calc/simulate'
import { formatNZD, formatPct } from '../format'

interface Props {
  result: SimulationResult
  horizon: number
  rentMonthly: number
  purchasePrice: number
}

export default function ResultsSummary({ result, horizon, rentMonthly, purchasePrice }: Props) {
  const { buyingWins, difference, finalBuyerNetWorth, finalRenterNetWorth } = result
  const winner = buyingWins ? 'Buying' : 'Renting'
  const otherPath = buyingWins ? 'renting' : 'buying'
  const gap = Math.abs(difference)
  const advantageLabel = `${winner} advantage`
  const losingNetWorth = buyingWins ? finalRenterNetWorth : finalBuyerNetWorth
  const advantagePct = losingNetWorth === 0 ? 0 : (gap / Math.abs(losingNetWorth)) * 100
  const rentPurchasePct = purchasePrice === 0 ? 0 : ((rentMonthly * 12) / purchasePrice) * 100

  return (
    <div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Headline result</p>
        <p className={`mt-1 text-2xl font-bold ${buyingWins ? 'text-emerald-700' : 'text-sky-700'}`}>
          {winner} is ahead by {formatNZD(gap)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          After {horizon} {horizon === 1 ? 'year' : 'years'}, this path ends with more net worth than {otherPath}
          for the assumptions entered below.
        </p>
      </div>
      <p className="mb-3 text-sm text-slate-600">
        Final net worth after {horizon} {horizon === 1 ? 'year' : 'years'}
      </p>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Renting final net worth" value={formatNZD(finalRenterNetWorth)} />
        <KpiCard label="Buying final net worth" value={formatNZD(finalBuyerNetWorth)} />
        <KpiCard
          label={advantageLabel}
          value={formatNZD(gap)}
          detail={`${formatPct(advantagePct)} ahead of the other path`}
          tone={buyingWins ? 'emerald' : 'sky'}
        />
        <KpiCard
          label="Rent/Purchase Price"
          value={formatPct(rentPurchasePct)}
          detail="Annual rent divided by purchase price"
        />
      </dl>
    </div>
  )
}

export function BreakEvenSummary({ result }: { result: SimulationResult }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Break-even</h3>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Stat
          label="First year buying catches up"
          value={result.crossoverYear === null ? 'Not within horizon' : `Year ${result.crossoverYear}`}
        />
        <Stat label="Portfolio return after tax" value={formatPct(result.afterTaxReturnPct)} />
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        Break-even means the first projected year where buying is worth at least as much as renting and investing.
      </p>
    </div>
  )
}

function KpiCard({
  label,
  value,
  detail,
  tone = 'slate',
}: {
  label: string
  value: string
  detail?: string
  tone?: 'emerald' | 'sky' | 'slate'
}) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-700' : tone === 'sky' ? 'text-sky-700' : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className={`mt-2 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</dd>
      {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  )
}
