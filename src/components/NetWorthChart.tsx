import {
  Area,
  AreaChart,
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
import ChartTooltip from './ChartTooltip'

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
  const horizonYear = data[data.length - 1]?.year ?? 0
  const crossoverYear =
    result.buyingWins && result.crossoverYear !== null && result.crossoverYear > 0 && result.crossoverYear <= horizonYear
      ? result.crossoverYear
      : null

  return (
    <>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Net worth over time</h3>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 28, right: 12, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="buyingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="rentingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} stroke="#94a3b8" fontSize={12} />
            <YAxis tickFormatter={(v) => formatNZDCompact(Number(v))} stroke="#94a3b8" fontSize={12} width={64} />
            <Tooltip
              content={<ChartTooltip formatter={formatNZD} />}
              cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4', strokeWidth: 1 }}
            />
            <Legend />
            {crossoverYear !== null && (
              <ReferenceLine
                x={crossoverYear}
                stroke="#059669"
                strokeDasharray="5 5"
                label={{ value: 'Buying wins', fontSize: 11, fill: '#047857', position: 'insideTopLeft' }}
              />
            )}
            {mortgagePaidOffYear !== null && (
              <ReferenceLine
                x={mortgagePaidOffYear}
                stroke="#a3a3a3"
                strokeDasharray="4 4"
                label={<MortgagePaidOffLabel />}
              />
            )}
            <Area
              type="monotone"
              dataKey="Buying"
              stroke="#059669"
              strokeWidth={2.5}
              fill="url(#buyingGradient)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="Renting"
              stroke="#0284c7"
              strokeWidth={2.5}
              fill="url(#rentingGradient)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Net worth assumes you cash out that year: the buyer sells and clears the mortgage, while the renter liquidates
        the portfolio. Selling costs and NZ exit tax are not modelled.
      </p>
    </>
  )
}

type ReferenceLabelProps = {
  viewBox?: {
    x?: number
    y?: number
  }
}

function MortgagePaidOffLabel({ viewBox }: ReferenceLabelProps) {
  const x = Number(viewBox?.x ?? 0)
  const y = Number(viewBox?.y ?? 0)

  return (
    <g transform={`translate(${x - 136}, ${y + 8})`}>
      <rect width="128" height="24" rx="12" fill="#fff" stroke="#cbd5e1" />
      <path
        d="M10 13l7-6 7 6M12 12v7h10v-7"
        fill="none"
        stroke="#64748b"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="30" y="16" fill="#475569" fontSize="11" fontWeight="600">
        Mortgage paid off
      </text>
    </g>
  )
}
