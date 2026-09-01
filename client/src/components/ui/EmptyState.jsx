import Icon from './Icon.jsx'

// Etat vide d'une liste. `children` accueille en general un <Button>.
function EmptyState({ icon = 'documents', title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span className="rounded-xl bg-slate-100 p-2.5 text-slate-400">
        <Icon name={icon} className="size-6" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export default EmptyState
