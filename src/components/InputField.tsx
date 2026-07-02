import { useEffect, useId, useState, type ReactNode } from 'react'
import InfoTooltip from './InfoTooltip'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  prefix?: string
  suffix?: string
  tooltip?: string
  labelAccessory?: ReactNode // optional control shown at the right of the label row (e.g. a % / $ toggle)
  step?: number
  min?: number
  max?: number
}

function clamp(n: number, min?: number, max?: number): number {
  if (min !== undefined && n < min) return min
  if (max !== undefined && n > max) return max
  return n
}

/** Labelled numeric input with an optional prefix/suffix and a hover tooltip. */
export default function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  tooltip,
  labelAccessory,
  step = 1,
  min,
  max,
}: Props) {
  const [text, setText] = useState(String(value))
  const inputId = useId()

  // Keep the field in sync when the value changes from outside (reset, share link).
  useEffect(() => {
    if (Number(text) !== value) setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function handleChange(raw: string) {
    setText(raw)
    if (raw === '') return
    const n = Number(raw)
    if (Number.isFinite(n)) onChange(n)
  }

  function handleBlur() {
    const n = Number(text)
    if (text === '' || !Number.isFinite(n)) {
      setText(String(value))
      return
    }
    const clamped = clamp(n, min, max)
    setText(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  return (
    <div className="block">
      <div className="flex min-h-5 items-center gap-2">
        <label htmlFor={inputId} className="flex min-w-0 items-center gap-1 text-sm font-medium text-slate-700">
          <span>{label}</span>
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        {labelAccessory && <span className="ml-auto shrink-0">{labelAccessory}</span>}
      </div>
      <div className="mt-1 flex items-center rounded-md border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
        {prefix && <span className="pl-2 text-sm text-slate-400">{prefix}</span>}
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          value={text}
          step={step}
          min={min}
          max={max}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-transparent px-2 py-2.5 text-sm text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && <span className="pr-2 text-sm text-slate-400">{suffix}</span>}
      </div>
    </div>
  )
}
