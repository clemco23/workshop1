import { cn } from '../../lib/cn.js'

// Select natif habille : garde le clavier et l'accessibilite du natif.
// `options` = [{ value, label }] ; `value=''` correspond a l'option neutre.
function Select({ label, value, onChange, options, className }) {
  return (
    <label className={cn('inline-flex flex-col gap-1', className)}>
      {label && (
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</span>
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default Select
