import type { MonthlyCostBreakdown } from '../calc/simulate'
import { formatNZD } from '../format'

function Row({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1 text-slate-600">{label}</td>
      <td className="py-1 text-right tabular-nums text-slate-900">{formatNZD(value)}</td>
    </tr>
  )
}

export default function CostBreakdown({ b }: { b: MonthlyCostBreakdown }) {
  const diff = b.buyerTotal - b.renterTotal

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Monthly cost (first month)</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-semibold text-emerald-700">Owning</p>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Mortgage (P&I)" value={b.mortgagePayment} />
              <Row label="Council rates" value={b.councilRates} />
              <Row label="Maintenance" value={b.maintenance} />
              <Row label="House insurance" value={b.houseInsurance} />
              {b.bodyCorporate > 0 && <Row label="Body corporate" value={b.bodyCorporate} />}
              <tr className="font-semibold">
                <td className="py-1">Total</td>
                <td className="py-1 text-right tabular-nums">{formatNZD(b.buyerTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <p className="mb-1 font-semibold text-sky-700">Renting</p>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Rent" value={b.rent} />
              <Row label="Contents insurance" value={b.contentsInsurance} />
              <tr className="font-semibold">
                <td className="py-1">Total</td>
                <td className="py-1 text-right tabular-nums">{formatNZD(b.renterTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Owning costs {formatNZD(Math.abs(diff))} {diff >= 0 ? 'more' : 'less'} per month than renting to start. Each
        month the cheaper side invests its surplus.
      </p>
    </div>
  )
}
