import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SimulationResult } from '../calc/simulate'
import { formatNZD, formatNZDCompact } from '../format'

interface Props {
  result: SimulationResult
  mortgagePaidOffYear: number | null
}

export default function NetWorthChart({ result, mortgagePaidOffYear }: Props) {
  const data = result.series.map((p) => ({
    year: p.year,
    Buying: Math.round(p.buyerNetWorth),
    Renting: Math.round(p.renterNetWorth),
  }))

  return (
    <>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Net worth over time</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} stroke="#94a3b8" fontSize={12} />
            <YAxis tickFormatter={(v) => formatNZDCompact(Number(v))} stroke="#94a3b8" fontSize={12} width={64} />
            <Tooltip
              formatter={(v) => formatNZD(Number(v))}
              labelFormatter={(y) => `Year ${y}`}
              contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Legend />
            {mortgagePaidOffYear !== null && (
              <ReferenceLine
                x={mortgagePaidOffYear}
                stroke="#a3a3a3"
                strokeDasharray="4 4"
                label={{ value: 'Mortgage paid off', fontSize: 11, fill: '#737373', position: 'insideTopRight' }}
              />
            )}
            <Line type="monotone" dataKey="Buying" stroke="#059669" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Renting" stroke="#0284c7" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Net worth assumes you cash out that year: the buyer sells (net of selling costs) and clears the mortgage, while
        the renter liquidates the portfolio. NZ has no exit/capital-gains tax in this model, so the portfolio is already
        after-tax.
      </p>
    </>
  )
}
