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
