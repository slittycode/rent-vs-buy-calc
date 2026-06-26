import { useEffect, useState } from 'react'
import type { ExpenseMode } from '../types'
import { convertMode, resolveAmount } from '../calc/expenses'
import { formatNZD } from '../format'

interface Props {
  label: string
  value: number
  mode: ExpenseMode
  base: number // base the percentage applies to (e.g. purchase price / home value)
  onChange: (value: number, mode: ExpenseMode) => void
  /** What the back-calculated dollar figure represents, e.g. '/yr' or '' (one-time). */
  periodLabel?: string
  tooltip?: string
  pctStep?: number
  dollarStep?: number
  pctMax?: number
}

/**
 * A numeric input that toggles between a percentage of a base and a fixed dollar
 * amount. Flipping the toggle back-calculates the value so the dollar amount it
 * represents is preserved (1% of $850,000 ⇄ $8,500), and a hint line shows the
 * equivalent in the other unit so the trade-off is always visible.
 */
export default function ToggleableField({
  label,
  value,
  mode,
  base,
  onChange,
  periodLabel = '',
  tooltip,
  pctStep = 0.1,
  dollarStep = 100,
  pctMax = 100,
}: Props) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    if (Number(text) !== value) setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode])

  const isPct = mode === 'pct'
  const step = isPct ? pctStep : dollarStep
  const min = 0
  const max = isPct ? pctMax : undefined

  function commit(raw: string) {
    setText(raw)
    if (raw === '') return
    const n = Number(raw)
    if (Number.isFinite(n)) onChange(n, mode)
  }

  function handleBlur() {
    const n = Number(text)
    if (text === '' || !Number.isFinite(n)) {
      setText(String(value))
      return
    }
    let clamped = n
    if (clamped < min) clamped = min
    if (max !== undefined && clamped > max) clamped = max
    setText(String(clamped))
    if (clamped !== value) onChange(clamped, mode)
  }

  function switchTo(next: ExpenseMode) {
    if (next === mode) return
    const converted = round(convertMode(mode, next, value, base))
    onChange(converted, next)
  }

  const equivalent = isPct
    ? `≈ ${formatNZD(resolveAmount('pct', value, base))}${periodLabel}`
    : base > 0
      ? `≈ ${(base === 0 ? 0 : (value / base) * 100).toFixed(2)}% of value`
      : ''

  return (
    <label className="block">
      <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {tooltip && (
          <span
            title={tooltip}
            className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600"
          >
            ?
          </span>
        )}
      </span>
      <div className="mt-1 flex items-stretch gap-1">
        <div className="flex flex-1 items-center rounded-md border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
          {!isPct && <span className="pl-2 text-sm text-slate-400">$</span>}
          <input
            type="number"
            inputMode="decimal"
            value={text}
            step={step}
            min={min}
            max={max}
            onChange={(e) => commit(e.target.value)}
            onBlur={handleBlur}
            className="w-full bg-transparent px-2 py-1.5 text-sm text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {isPct && <span className="pr-2 text-sm text-slate-400">%</span>}
        </div>
        <div className="flex overflow-hidden rounded-md border border-slate-300" role="group" aria-label={`${label} unit`}>
          <ModeButton active={isPct} onClick={() => switchTo('pct')} ariaLabel="percentage">
            %
          </ModeButton>
          <ModeButton active={!isPct} onClick={() => switchTo('dollar')} ariaLabel="dollar amount">
            $
          </ModeButton>
        </div>
      </div>
      {equivalent && <span className="mt-1 block text-xs tabular-nums text-slate-400">{equivalent}</span>}
    </label>
  )
}

function ModeButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean
  onClick: () => void
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`w-7 text-sm font-semibold ${
        active ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

/** Keep converted values tidy: 2 dp for percentages-sized numbers, whole dollars for large ones. */
function round(n: number): number {
  if (Math.abs(n) >= 1000) return Math.round(n)
  return Math.round(n * 100) / 100
}
