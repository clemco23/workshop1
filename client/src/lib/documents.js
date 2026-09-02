// Logique de la page Documents, en fonctions pures : filtrage et comptage par
// categorie. Testable sans navigateur, et le back n'a qu'a renvoyer les lignes.

export function filtrerDocuments(
  documents,
  { categorie = '', missionId = '', recherche = '' } = {},
) {
  const terme = recherche.trim().toLowerCase()

  return documents
    .filter((d) => !categorie || d.categorie === categorie)
    // 'aucune' = les documents non rattaches (mission_id est nullable).
    .filter((d) =>
      !missionId ? true : missionId === 'aucune' ? d.missionId == null : d.missionId === missionId,
    )
    .filter((d) => !terme || d.nomOriginal.toLowerCase().includes(terme))
}

export function compterParCategorie(documents) {
  const compte = {}
  for (const document of documents) {
    compte[document.categorie] = (compte[document.categorie] ?? 0) + 1
  }
  return compte
}

export function totalTaille(documents) {
  return documents.reduce((acc, d) => acc + (d.taille ?? 0), 0)
}

// Un PDF, une image ou autre chose : sert a choisir l'icone de la ligne.
export function familleFichier(mimeType = '') {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  return 'autre'
}
