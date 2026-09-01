// Concatene des classes en ignorant les valeurs falsy.
// `cn('p-4', isActive && 'bg-brand-50', className)`
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default cn
