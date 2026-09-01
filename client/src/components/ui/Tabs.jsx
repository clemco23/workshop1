import { cn } from '../../lib/cn.js'

// Bascule segmentee, controlee : `options` = [{ value, label, icon? }].
// Reutilisable pour toute page qui offre plusieurs vues d'un meme jeu de donnees.
function Tabs({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5"
    >
      {options.map((option) => {
        const actif = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              actif
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
