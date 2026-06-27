import type { SimulationResult } from '../calc/simulate'
import { formatNZD } from '../format'

interface Props {
  current: SimulationResult
  pinned: SimulationResult | null
  onClear: () => void
  onSwap: () => void
}

/** Signed difference (buyer − renter) phrased as which side is ahead. */
function advantage(r: SimulationResult): string {
  const gap = Math.abs(r.difference)
  return `${r.buyingWins ? 'Buying' : 'Renting'} +${formatNZD(gap)}`
}

function breakEven(r: SimulationResult): string {
  return r.crossoverYear === null ? 'Not within horizon' : `Year ${r.crossoverYear}`
}

/** Side-by-side comparison of a pinned scenario (A) against the live one (B). */
export default function ScenarioCompare({ current, pinned, onClear, onSwap }: Props) {
  if (!pinned) return null

  const rows: { label: string; a: string; b: string; delta: number | null }[] = [
    {
      label: 'Buying net worth',
      a: formatNZD(pinned.finalBuyerNetWorth),
      b: formatNZD(current.finalBuyerNetWorth),
      delta: current.finalBuyerNetWorth - pinned.finalBuyerNetWorth,
    },
    {
      label: 'Renting net worth',
      a: formatNZD(pinned.finalRenterNetWorth),
      b: formatNZD(current.finalRenterNetWorth),
      delta: current.finalRenterNetWorth - pinned.finalRenterNetWorth,
    },
    { label: 'Advantage', a: advantage(pinned), b: advantage(current), delta: null },
    { label: 'Break-even', a: breakEven(pinned), b: breakEven(current), delta: null },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Compare scenarios</h3>
        <div className="flex gap-2">
          <button
            onClick={onSwap}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Swap A/B
          </button>
          <button
            onClick={onClear}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="py-1 font-medium"> </th>
            <th className="py-1 text-right font-medium">A (pinned)</th>
            <th className="py-1 text-right font-medium">B (current)</th>
            <th className="py-1 text-right font-medium">Δ (B − A)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-100">
              <td className="py-1.5 text-slate-600">{row.label}</td>
              <td className="py-1.5 text-right tabular-nums text-slate-900">{row.a}</td>
              <td className="py-1.5 text-right tabular-nums text-slate-900">{row.b}</td>
              <td
                className={`py-1.5 text-right tabular-nums ${
                  row.delta === null
                    ? 'text-slate-400'
                    : row.delta > 0
                      ? 'text-emerald-700'
                      : row.delta < 0
                        ? 'text-rose-700'
                        : 'text-slate-500'
                }`}
              >
                {row.delta === null
                  ? '—'
                  : `${row.delta >= 0 ? '+' : '−'}${formatNZD(Math.abs(row.delta))}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">
        A is the scenario you pinned; B updates as you edit the inputs. Both are drawn on the Net Worth chart and
        captured in the share link.
      </p>
    </div>
  )
}
