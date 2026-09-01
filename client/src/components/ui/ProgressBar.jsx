import { cn } from '../../lib/cn.js'

const tones = {
  brand: 'bg-brand-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

// Jauge simple : `value` / `max` en unites metier (heures, euros...).
function ProgressBar({ value, max = 100, tone = 'brand', label, className }) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0

  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', tones[tone])}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  )
}

export default ProgressBar
