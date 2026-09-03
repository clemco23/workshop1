import { cn } from '../../lib/cn.js'

// Conteneur de base : toutes les surfaces blanches du site passent par ici.
// `title` / `action` sont optionnels, sans eux la carte n'est qu'une boite.
function Card({ title, subtitle, action, padded = true, className, children }) {
  const hasHeader = title || action

  return (
    <section className={cn('min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs', className)}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(padded && 'p-5')}>{children}</div>
    </section>
  )
}

export default Card
