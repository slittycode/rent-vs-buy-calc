import { useId, useState } from 'react'

/**
 * Small "?" affordance that reveals help text on hover (mouse) and on tap (touch).
 *
 * Hover uses pointer events filtered to `pointerType === 'mouse'`, while the tap/keyboard
 * path is driven purely by `onClick` (a tap fires a click, as does Enter/Space when
 * focused). Keeping touch off the pointer-enter path avoids the classic bug where a tap
 * opens via a synthetic mouse-enter and then immediately closes via the click toggle.
 */
export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="More info"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          // Don't let the click bubble to a wrapping <label> and focus its input.
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') setOpen(true)
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setOpen(false)
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-300"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-7 z-20 w-52 max-w-[min(15rem,75vw)] -translate-x-1/2 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-normal leading-snug text-white shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  )
}
