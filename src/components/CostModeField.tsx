import { NUMERIC_INPUT_LIMITS, type NumericInputKey } from '../inputLimits'
import InputField from './InputField'

interface Props {
  label: string
  tooltip?: string
  isFixed: boolean
  onIsFixedChange: (value: boolean) => void
  percentKey: NumericInputKey
  percentValue: number
  onPercentChange: (value: number) => void
  percentStep?: number
  fixedKey: NumericInputKey
  fixedValue: number
  onFixedChange: (value: number) => void
  fixedStep?: number
}

export default function CostModeField({
  label,
  tooltip,
  isFixed,
  onIsFixedChange,
  percentKey,
  percentValue,
  onPercentChange,
  percentStep,
  fixedKey,
  fixedValue,
  onFixedChange,
  fixedStep,
}: Props) {
  const activeKey = isFixed ? fixedKey : percentKey
  const limits = NUMERIC_INPUT_LIMITS[activeKey]

  return (
    <InputField
      key={isFixed ? 'fixed' : 'percent'}
      label={label}
      value={isFixed ? fixedValue : percentValue}
      onChange={isFixed ? onFixedChange : onPercentChange}
      prefix={isFixed ? '$' : undefined}
      suffix={isFixed ? '/yr' : '%'}
      step={isFixed ? fixedStep : percentStep}
      min={limits.min}
      max={limits.max}
      tooltip={tooltip}
      labelAccessory={
        <CostModeToggle label={label} isFixed={isFixed} onChange={onIsFixedChange} />
      }
    />
  )
}

function CostModeToggle({
  label,
  isFixed,
  onChange,
}: {
  label: string
  isFixed: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <span className="inline-flex" role="group" aria-label={`${label} input mode`}>
      <ModeButton selected={!isFixed} onClick={() => onChange(false)} ariaLabel={`Use percent for ${label}`}>
        %
      </ModeButton>
      <ModeButton selected={isFixed} onClick={() => onChange(true)} ariaLabel={`Use dollars per year for ${label}`} joined>
        $
      </ModeButton>
    </span>
  )
}

function ModeButton({
  selected,
  onClick,
  ariaLabel,
  joined = false,
  children,
}: {
  selected: boolean
  onClick: () => void
  ariaLabel: string
  joined?: boolean
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`min-h-6 min-w-8 border px-2 text-xs font-medium ${
        joined ? '-ml-px rounded-r-md' : 'rounded-l-md'
      } ${
        selected
          ? 'border-sky-600 bg-sky-50 text-sky-700'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}
