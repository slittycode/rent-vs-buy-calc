import type { SimulationResult } from '../calc/simulate'
import { formatNZD } from '../format'

function Row({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1 text-slate-600">{label}</td>
      <td className="py-1 text-right tabular-nums text-slate-900">{formatNZD(value)}</td>
    </tr>
  )
}

export default function CostBreakdown({ result, horizon }: { result: SimulationResult; horizon: number }) {
  const b = result.firstMonth
  const diff = b.buyerTotal - b.renterTotal
  const upfront = result.deposit + result.purchaseCostsAmount

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Monthly cost (first month)</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-semibold text-emerald-700">Owning</p>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Mortgage (P&I)" value={b.mortgagePayment} />
              <Row label="Council rates" value={b.propertyTax} />
              <Row label="Maintenance" value={b.maintenance} />
              <Row label="Home insurance" value={b.homeInsurance} />
              {b.otherHomeCosts > 0 && <Row label="Body corp / other" value={b.otherHomeCosts} />}
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
              <Row label="Contents insurance" value={b.rentInsurance} />
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

      <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">One-off costs</h3>
      <table className="w-full text-sm">
        <tbody>
          <Row label="Deposit" value={result.deposit} />
          <Row label="Buying costs (legal, LIM, report)" value={result.purchaseCostsAmount} />
          <tr className="border-b border-slate-100 font-semibold">
            <td className="py-1">Upfront cash to buy</td>
            <td className="py-1 text-right tabular-nums">{formatNZD(upfront)}</td>
          </tr>
          <Row label={`Selling costs if sold in year ${horizon}`} value={result.sellingCostsAtHorizon} />
          {result.brightLineTaxAtHorizon > 0 && (
            <Row label={`Bright-line tax if sold in year ${horizon}`} value={result.brightLineTaxAtHorizon} />
          )}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">
        The renter invests the {formatNZD(upfront)} of upfront cash from day one. Selling costs are deducted from the
        home&rsquo;s value whenever you treat it as sold.
      </p>
    </div>
  )
}
