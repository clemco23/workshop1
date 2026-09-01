// Formatage fr-FR, centralise pour que tout le site affiche pareil.
// Attention : Prisma serialise les Decimal en *chaines* dans le JSON
// ('40.00' et pas 40) — d'ou le Number() systematique avant calcul/affichage.

const eurosFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const heuresFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' })

const moisFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

// Decimal Prisma (string | number | null) -> number
export function num(value) {
  return value == null ? 0 : Number(value)
}

export function formatEuros(value) {
  return eurosFmt.format(num(value))
}

export function formatHeures(value) {
  return heuresFmt.format(num(value))
}

export function formatDate(value) {
  return value ? dateFmt.format(new Date(value)) : '—'
}

export function formatMois(value) {
  return moisFmt.format(new Date(value))
}

// '24 aout → 28 aout' ; date_fin est nullable dans le schema.
export function formatPeriode(debut, fin) {
  return fin ? `${formatDate(debut)} → ${formatDate(fin)}` : `depuis le ${formatDate(debut)}`
}

export function formatTaille(octets) {
  if (!octets) return '—'
  const ko = octets / 1024
  return ko < 1024 ? `${Math.round(ko)} Ko` : `${heuresFmt.format(ko / 1024)} Mo`
}
