import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SimulationResult } from '../calc/simulate'
import { formatNZDCompact } from '../format'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  result: SimulationResult
  mortgagePaidOffYear: number | null
}

export default function RenterSavingsChart({ result, mortgagePaidOffYear }: Props) {
  const data = result.series.map((p) => ({
    year: p.year,
    periodMonths: p.periodMonths,
    'Renter Savings': Math.round(p.renterAnnualSavings),
  }))

  return (
    <>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Renter savings
      </h3>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="year"
              tickFormatter={(y) => `${y}y`}
              stroke="#94a3b8"
              fontSize={12}
            />
            <YAxis
              tickFormatter={(v) => formatNZDCompact(Number(v))}
              stroke="#94a3b8"
              fontSize={12}
              width={64}
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  payload={props.payload as Parameters<typeof ChartTooltip>[0]['payload']}
                  label={props.label}
                />
              )}
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" />
            {mortgagePaidOffYear !== null && (
              <ReferenceLine
                x={mortgagePaidOffYear}
                stroke="#d1d5db"
                strokeDasharray="4 4"
                label={{
                  value: 'Mortgage paid off',
                  fontSize: 11,
                  fill: '#9ca3af',
                  position: 'insideTopRight',
                }}
              />
            )}
            <Bar dataKey="Renter Savings" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry['Renter Savings'] >= 0 ? '#059669' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Positive values (green) mean renting costs less for that period, so the renter has more to
        invest. Negative values (red) mean buying costs less for that period.
      </p>
    </>
  )
}
