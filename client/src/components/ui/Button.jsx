import { cn } from '../../lib/cn.js'

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border-transparent',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent',
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
}

// `as` permet de garder le style en rendant autre chose qu'un <button>,
// typiquement <Button as={Link} to="/missions">.
function Button({ as: As = 'button', variant = 'primary', size = 'md', className, ...props }) {
  return (
    <As
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-medium',
        'transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export default Button
