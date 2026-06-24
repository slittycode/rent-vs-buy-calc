import type { SimulationResult } from '../calc/simulate'
import { formatNZD, formatPct } from '../format'

interface Props {
  result: SimulationResult
  horizon: number
}

export default function ResultsSummary({ result, horizon }: Props) {
  const { buyingWins, difference, finalBuyerNetWorth, finalRenterNetWorth, crossoverYear, afterTaxReturnPct } =
    result
  const winner = buyingWins ? 'Buying' : 'Renting'
  const gap = Math.abs(difference)
  const accent = buyingWins ? 'text-emerald-700' : 'text-sky-700'
  const box = buyingWins ? 'bg-emerald-50 border-emerald-200' : 'bg-sky-50 border-sky-200'

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${box}`}>
      <p className="text-sm text-slate-600">After {horizon} {horizon === 1 ? 'year' : 'years'}…</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>
        {winner} comes out ahead by {formatNZD(gap)}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <Stat label="Buyer net worth" value={formatNZD(finalBuyerNetWorth)} />
        <Stat label="Renter net worth" value={formatNZD(finalRenterNetWorth)} />
        <Stat
          label="Break-even"
          value={crossoverYear === null ? 'Not within horizon' : `Year ${crossoverYear}`}
        />
        <Stat label="Portfolio return (after tax)" value={formatPct(afterTaxReturnPct)} />
      </dl>
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
