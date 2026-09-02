import { useId } from 'react'
import { cn } from '../../lib/cn.js'

// Champ de saisie habille, meme grammaire que Select : `label` au-dessus,
// `hint` en dessous, `erreur` remplace le hint et passe le champ en rouge.
// `suffixe` sert aux unites (h, mois) — il est en aria-hidden, l'unite etant
// deja dans le label.
function Input({
  label,
  value,
  onChange,
  hint,
  erreur,
  suffixe,
  type = 'text',
  className,
  ...props
}) {
  const id = useId()
  const idAide = `${id}-aide`

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium tracking-wide text-slate-500 uppercase"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={hint || erreur ? idAide : undefined}
          className={cn(
            'h-9 w-full min-w-0 rounded-lg border bg-white px-2.5 text-sm text-slate-900',
            'placeholder:text-slate-400',
            suffixe && 'pr-12',
            erreur ? 'border-red-300' : 'border-slate-200',
          )}
          {...props}
        />
        {suffixe && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400"
          >
            {suffixe}
          </span>
        )}
      </div>

      {(erreur || hint) && (
        <p id={idAide} className={cn('text-xs', erreur ? 'text-red-600' : 'text-slate-500')}>
          {erreur ?? hint}
        </p>
      )}
    </div>
  )
}

export default Input
