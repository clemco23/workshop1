import { cn } from '../../lib/cn.js'

// Select natif habille : garde le clavier et l'accessibilite du natif.
// `options` = [{ value, label }] ; `value=''` correspond a l'option neutre.
// `hint` sous le champ, meme grammaire que Input.
function Select({ label, value, onChange, options, hint, className }) {
  return (
    <label className={cn('inline-flex min-w-0 max-w-full flex-col gap-1', className)}>
      {label && (
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</span>
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        // w-full + min-w-0 : sinon le select se dimensionne sur son option la plus
        // longue et fait deborder la page (cf. CLAUDE.md, Debordement horizontal).
        className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export default Select
