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
    </div>
  )
}
