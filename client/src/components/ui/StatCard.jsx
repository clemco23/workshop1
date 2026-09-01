import Icon from './Icon.jsx'
import { cn } from '../../lib/cn.js'

// Tuile de chiffre cle. `trend` est un nombre signe en % (null = pas de tendance),
// `children` sert a glisser une jauge ou une precision sous la valeur.
function StatCard({ label, value, unit, icon, trend, hint, children, className }) {
  const up = trend > 0

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-xs', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</span>
        {icon && (
          <span className="rounded-lg bg-brand-50 p-1.5 text-brand-600">
            <Icon name={icon} className="size-4" />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>

      {(trend != null || hint) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {trend != null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                up ? 'text-emerald-600' : 'text-red-600',
              )}
            >
              <Icon name={up ? 'trendUp' : 'trendDown'} className="size-3.5" />
              {up ? '+' : ''}
              {trend} %
            </span>
          )}
          {hint && <span className="text-slate-500">{hint}</span>}
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export default StatCard
