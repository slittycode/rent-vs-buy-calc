import type { SimulationResult } from '../calc/simulate'
import { formatNZD, formatPct, formatYears } from '../format'

interface Props {
  result: SimulationResult
  rentMonthly: number
  purchasePrice: number
}

export default function ResultsSummary({ result, rentMonthly, purchasePrice }: Props) {
  const { buyingWins, difference, finalBuyerNetWorth, finalRenterNetWorth } = result
  const winner = buyingWins ? 'Buying' : 'Renting'
  const otherPath = buyingWins ? 'renting' : 'buying'
  const gap = Math.abs(difference)
  const isTie = Math.round(gap) === 0
  const tieSummary = 'Both paths finish with the same projected net worth'
  const advantageLabel = isTie ? 'No advantage' : `${winner} advantage`
  const losingNetWorth = buyingWins ? finalRenterNetWorth : finalBuyerNetWorth
  const losingNetWorthRoundsToZero = Math.round(Math.abs(losingNetWorth)) === 0
  const advantageDetail = (() => {
    if (isTie) return tieSummary
    if (losingNetWorthRoundsToZero) return 'Percentage advantage is not meaningful because the other path is $0'
    return `${formatPct((gap / Math.abs(losingNetWorth)) * 100)} ahead of the other path`
  })()
  const rentPurchaseValue = purchasePrice === 0 ? 'N/A' : formatPct(((rentMonthly * 12) / purchasePrice) * 100)
  const rentPurchaseDetail =
    purchasePrice === 0
      ? 'Rent/Purchase Price is not meaningful because purchase price is $0'
      : 'Annual rent divided by purchase price'
  const horizonLabel = formatYears(result.horizonYears)

  return (
    <div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Headline result</p>
        <p
          className={`mt-1 text-2xl font-bold ${
            isTie ? 'text-slate-900' : buyingWins ? 'text-emerald-700' : 'text-sky-700'
          }`}
        >
          {isTie ? tieSummary : `${winner} is ahead by ${formatNZD(gap)}`}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {isTie
            ? `After ${horizonLabel}, both paths end with the same projected net worth for the assumptions entered below.`
            : `After ${horizonLabel}, this path ends with more net worth than ${otherPath} for the assumptions entered below.`}
        </p>
      </div>
      <p className="mb-3 text-sm text-slate-600">Final net worth after {horizonLabel}</p>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Renting final net worth" value={formatNZD(finalRenterNetWorth)} />
        <KpiCard label="Buying final net worth" value={formatNZD(finalBuyerNetWorth)} />
        <KpiCard
          label={advantageLabel}
          value={formatNZD(gap)}
          detail={advantageDetail}
          tone={isTie ? 'slate' : buyingWins ? 'emerald' : 'sky'}
        />
        <KpiCard label="Rent/Purchase Price" value={rentPurchaseValue} detail={rentPurchaseDetail} />
      </dl>
    </div>
  )
}

export function BreakEvenSummary({ result }: { result: SimulationResult }) {
  const be = result.breakEvenRent
  const breakEvenValue =
    be === null ? (result.difference >= 0 ? 'Buying wins at any rent' : 'Renting wins at any rent') : `${formatNZD(be)}/mo`

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Break-even &amp; key figures</h3>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Stat
          label="First time buying catches up"
          value={result.crossoverYear === null ? 'Not within horizon' : formatYears(result.crossoverYear)}
        />
        <Stat label="Break-even rent" value={breakEvenValue} />
        <Stat label="Portfolio return (after tax & fees)" value={formatPct(result.afterTaxReturnPct)} />
        <Stat label="Mortgage payment (P&I)" value={`${formatNZD(result.monthlyPaymentPI)}/mo`} />
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        <strong>Break-even rent</strong> is the monthly rent that would leave renting and buying level at your horizon:
        below it renting comes out ahead, above it buying does. The catch-up time is the first projected month buying is
        worth at least as much as renting and investing.
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
