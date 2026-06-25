import { useEffect, useState } from 'react'
import InfoTooltip from './InfoTooltip'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  prefix?: string
  suffix?: string
  tooltip?: string
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
  step = 1,
  min,
  max,
}: Props) {
  const [text, setText] = useState(String(value))

  // Keep the field in sync when the value changes from outside (reset, share link).
  useEffect(() => {
    if (Number(text) !== value) setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function handleChange(raw: string) {
    setText(raw)
    if (raw === '') return
    const n = Number(raw)
    if (Number.isFinite(n)) onChange(n) // clamp only on blur so typing isn't fought
  }

  function handleBlur() {
    const n = Number(text)
    if (text === '' || !Number.isFinite(n)) {
      setText(String(value))
    } else {
      const clamped = clamp(n, min, max)
      setText(String(clamped))
      if (clamped !== value) onChange(clamped)
    }
  }

  return (
    <label className="block">
      <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </span>
      <div className="mt-1 flex items-center rounded-md border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
        {prefix && <span className="pl-2 text-sm text-slate-400">{prefix}</span>}
        <input
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
    </label>
  )
}
