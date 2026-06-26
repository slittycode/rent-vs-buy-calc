type TooltipPayloadItem = {
  name?: string | number
  value?: string | number
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  formatter: (value: number) => string
}

export default function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="min-w-40 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg">
      <p className="mb-2 text-center font-semibold">Year {label}</p>
      <div className="space-y-1">
        {payload.map((item) => {
          const value = Number(item.value)
          if (!Number.isFinite(value)) {
            return null
          }

          return (
            <div key={String(item.name)} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-slate-100">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color ?? '#cbd5e1' }}
                  aria-hidden="true"
                />
                {item.name}
              </span>
              <span className="font-semibold tabular-nums">{formatter(value)}</span>
            </div>
          )
        })}
      </div>
import { formatNZD } from '../format'

interface Entry {
  name?: string | number
  value?: string | number | (string | number)[]
  color?: string
}

interface Props {
  active?: boolean
  payload?: Entry[]
  label?: string | number
  labelPrefix?: string
}

export function ChartTooltip({ active, payload, label, labelPrefix = 'Year' }: Props) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#1e293b',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
        minWidth: 175,
        pointerEvents: 'none',
      }}
    >
      <p
        style={{
          color: '#94a3b8',
          fontSize: 11,
          textAlign: 'center',
          marginBottom: 8,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {labelPrefix} {label}
      </p>
      {payload.map((entry, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: i < payload.length - 1 ? 5 : 0,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: '#94a3b8', fontSize: 12, flex: 1 }}>{entry.name}:</span>
          <span style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600 }}>
            {formatNZD(Number(entry.value))}
          </span>
        </div>
      ))}
    </div>
  )
}
