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
import { formatNZDCompact } from '../format'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  result: SimulationResult
  mortgagePaidOffYear: number | null
}

export default function CashFlowChart({ result, mortgagePaidOffYear }: Props) {
  const data = result.series.map((p) => ({
    year: p.year,
    periodMonths: p.periodMonths,
    Buying: Math.round(p.buyerAnnualCost),
    Renting: Math.round(p.renterAnnualCost),
  }))

  return (
    <>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Cash flow by period
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
            <Legend />
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
            <Bar dataKey="Buying" fill="#059669" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Renting" fill="#0284c7" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Cash flow adds up housing costs since the previous chart point. Full-year points cover 12 months; a fractional
        final point covers only its remaining months. Year 0 is shown as zero so the chart lines up with the net-worth
        view.
      </p>
    </>
  )
}
