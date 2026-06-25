import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SimulationResult } from '../calc/simulate'
import { formatNZD, formatNZDCompact } from '../format'
import ChartTooltip from './ChartTooltip'

interface Props {
  result: SimulationResult
  mortgagePaidOffYear: number | null
}

export default function RenterSavingsChart({ result, mortgagePaidOffYear }: Props) {
  const data = result.series.map((p) => ({
    year: p.year,
    'Renter Savings': Math.round(p.renterAnnualSavings),
  }))

  return (
    <>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Renter savings</h3>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} stroke="#94a3b8" fontSize={12} />
            <YAxis tickFormatter={(v) => formatNZDCompact(Number(v))} stroke="#94a3b8" fontSize={12} width={64} />
            <Tooltip
              content={<ChartTooltip formatter={formatNZD} />}
              cursor={{ fill: '#e2e8f0', opacity: 0.35 }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" />
            {mortgagePaidOffYear !== null && (
              <ReferenceLine
                x={mortgagePaidOffYear}
                stroke="#a3a3a3"
                strokeDasharray="4 4"
                label={{ value: 'Mortgage paid off', fontSize: 11, fill: '#737373', position: 'insideTopRight' }}
              />
            )}
            <Bar dataKey="Renter Savings" fill="#0284c7" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Positive values mean renting costs less for that year, so the renter has more to invest. Negative values mean
        buying costs less for that year.
      </p>
    </>
  )
}
