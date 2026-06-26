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
import { formatNZDCompact } from '../format'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  result: SimulationResult
  mortgagePaidOffYear: number | null
}

const MortgagePaidOffLabel = (props: {
  viewBox?: { x: number; y: number; width: number; height: number }
}) => {
  if (!props.viewBox) return null
  const { x, y } = props.viewBox
  const hx = x + 5
  const hy = y + 5
  return (
    <g>
      {/* Simple house: peaked roof + walls + door opening */}
      <path
        d={`M${hx + 7},${hy + 1} L${hx + 13},${hy + 6} L${hx + 11},${hy + 6} L${hx + 11},${hy + 12} L${hx + 3},${hy + 12} L${hx + 3},${hy + 6} L${hx + 1},${hy + 6} Z`}
        stroke="#9ca3af"
        fill="none"
        strokeWidth={1.3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text x={hx + 18} y={hy + 10} fontSize={11} fill="#9ca3af" dominantBaseline="middle">
        Mortgage paid off
      </text>
    </g>
  )
}

const CrossoverLabel = (props: {
  viewBox?: { x: number; y: number; width: number; height: number }
}) => {
  if (!props.viewBox) return null
  const { x, y } = props.viewBox
  return (
    <text x={x + 5} y={y + 15} fontSize={11} fill="#818cf8">
      Buying wins
    </text>
  )
}

export default function NetWorthChart({ result, mortgagePaidOffYear }: Props) {
  const data = result.series.map((p) => ({
    year: p.year,
    Buying: Math.round(p.buyerNetWorth),
    Renting: Math.round(p.renterNetWorth),
  }))

  return (
    <>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Net worth over time
      </h3>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="buyingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="rentingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4', strokeWidth: 1 }}
            />
            <Legend />
            {mortgagePaidOffYear !== null && (
              <ReferenceLine
                x={mortgagePaidOffYear}
                stroke="#d1d5db"
                strokeDasharray="4 4"
                label={<MortgagePaidOffLabel />}
              />
            )}
            {result.crossoverYear !== null && (
              <ReferenceLine
                x={result.crossoverYear}
                stroke="#c7d2fe"
                strokeDasharray="4 4"
                label={<CrossoverLabel />}
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
        Net worth assumes you cash out that year: the buyer sells and clears the mortgage, while
        the renter liquidates the portfolio. Selling costs and NZ exit tax are not modelled.
      </p>
    </>
  )
}
