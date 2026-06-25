import InputField from './InputField'

interface Props {
  label: string
  tooltip?: string
  isFixed: boolean
  onModeChange: (isFixed: boolean) => void
  // Percent mode (% of home value)
  pctValue: number
  onPctChange: (v: number) => void
  pctStep?: number
  pctMin?: number
  pctMax?: number
  // Fixed mode ($ per year)
  fixedValue: number
  onFixedChange: (v: number) => void
  fixedStep?: number
  fixedMin?: number
  fixedMax?: number
}

/**
 * A cost input that can be entered either as a % (of home value) or a fixed $/year, chosen by
 * a small % / $ toggle in the label row. Each mode keeps its own value; the engine decides how
 * to apply it. Composes InputField so it inherits the shared styling, tooltip, and touch sizing.
 */
export default function CostModeField({
  label,
  tooltip,
  isFixed,
  onModeChange,
  pctValue,
  onPctChange,
  pctStep,
  pctMin,
  pctMax,
  fixedValue,
  onFixedChange,
  fixedStep,
  fixedMin,
  fixedMax,
}: Props) {
  const toggle = (
    <span className="inline-flex overflow-hidden rounded border border-slate-300 text-xs font-medium">
      <button
        type="button"
        aria-label="Enter as a percentage of home value"
        aria-pressed={!isFixed}
        onClick={(e) => {
          e.stopPropagation()
          onModeChange(false)
        }}
        className={`px-2 py-0.5 ${!isFixed ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
      >
        %
      </button>
      <button
        type="button"
        aria-label="Enter as a fixed dollar amount per year"
        aria-pressed={isFixed}
        onClick={(e) => {
          e.stopPropagation()
          onModeChange(true)
        }}
        className={`px-2 py-0.5 ${isFixed ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
      >
        $
      </button>
    </span>
  )

  const fieldProps = isFixed
    ? { value: fixedValue, onChange: onFixedChange, prefix: '$', suffix: '/yr', step: fixedStep, min: fixedMin, max: fixedMax }
    : { value: pctValue, onChange: onPctChange, suffix: '%', step: pctStep, min: pctMin, max: pctMax }

  // key on the mode so the field's internal text resets cleanly when the unit changes.
  return <InputField key={isFixed ? 'fixed' : 'pct'} label={label} tooltip={tooltip} labelAccessory={toggle} {...fieldProps} />
}
