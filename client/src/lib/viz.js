// Parametres de dataviz du site : couleurs de series et encre de graphe.
// Les pages/graphes lisent ces roles, jamais un hex en dur.
//
// Palette categorielle validee sur fond blanc (surface des cartes) :
//   #4f46e5 <-> #eb6834  ->  CVD dE 31.4 (protan) / 34.6 (tritan), normale 39.2,
//   contraste >= 3:1 pour les deux. La teinte suit l'entite (le *type* de mission),
//   jamais son rang : filtrer ne repeint jamais les survivants.
//
// Le type porte la teinte ; le statut est un second encodage (opacite reduite pour
// une mission seulement proposee), jamais un bord dessine autour de la marque.
export const VIZ = {
  series: {
    INTERMITTENCE: '#4f46e5', // = brand-600, accent du site
    FREELANCE: '#eb6834',
  },

  // Mission proposee : meme teinte, remplissage attenue (provisoire).
  opaciteProvisoire: 0.38,
  opacitePleine: 1,

  // Encre du graphe, une marche au-dessus de la surface, jamais en pointilles.
  grille: '#e2e8f0', // slate-200
  axe: '#cbd5e1', // slate-300
  encre: '#64748b', // slate-500

  // Specs de marque fixes (cf. skill dataviz).
  epaisseurBarre: 14, // <= 24px
  rayonBarre: 4,
}

export function couleurType(type) {
  return VIZ.series[type] ?? VIZ.encre
}

export function opaciteStatut(statut) {
  return statut === 'PROPOSED' ? VIZ.opaciteProvisoire : VIZ.opacitePleine
}

export default VIZ
