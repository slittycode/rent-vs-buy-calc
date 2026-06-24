import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export default function CashFlowChart({ result, mortgagePaidOffYear }: Props) {
  const data = result.series.map((p) => ({
    year: p.year,
    Buying: Math.round(p.buyerAnnualCost),
    Renting: Math.round(p.renterAnnualCost),
  }))

  return (
    <>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Annual cash flow</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
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
            <Bar dataKey="Buying" fill="#059669" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Renting" fill="#0284c7" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Annual cash flow adds up each year&rsquo;s housing costs. Year 0 is shown as zero so the chart lines up with the
        net-worth view.
      </p>
    </>
  )
}
