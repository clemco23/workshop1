// Miroir des enums de `server/prisma/schema.prisma`. L'API les renvoie en chaines
// ('CONFIRMED', 'INTERMITTENCE'...), pas en entiers : les colonnes `int` du schema
// SQL sont l'encodage Postgres, Prisma les serialise en texte dans le JSON.
// Toute modification d'un enum cote serveur doit etre repercutee ici.

export const MISSION_TYPE = {
  INTERMITTENCE: { label: 'Intermittence', tone: 'brand' },
  FREELANCE: { label: 'Freelance', tone: 'neutral' },
}

// Le `tone` brand est reserve a la teinte de *type* dans les graphes (cf.
// src/lib/viz.js) : un badge de statut ne le reutilise pas, sinon un statut
// prend la couleur d'un type.
export const MISSION_STATUT = {
  PROPOSED: { label: 'Proposee', tone: 'warning' },
  CONFIRMED: { label: 'Confirmee', tone: 'success' },
  TERMINATED: { label: 'Terminee', tone: 'neutral' },
}

export const DOCUMENT_CATEGORIE = {
  CONTRACT: { label: 'Contrat', tone: 'brand' },
  EMPLOYER_ATTESTATION: { label: 'Attestation employeur', tone: 'neutral' },
  QUOTE: { label: 'Devis', tone: 'warning' },
  INVOICE: { label: 'Facture', tone: 'success' },
  OTHER: { label: 'Autre', tone: 'neutral' },
}

export const PROJET_TAG = {
  PRO: { label: 'Pro', tone: 'brand' },
  PERSONAL: { label: 'Perso', tone: 'neutral' },
}

export const PROJET_TYPE = {
  IMAGE: { label: 'Image', tone: 'brand' },
  PDF: { label: 'PDF', tone: 'warning' },
  VIDEO: { label: 'Vidéo', tone: 'success' },
  LINK: { label: 'Lien', tone: 'neutral' },
}

// Les heures d'intermittence sont les seules qui comptent pour le seuil annuel.
export const STATUTS_ACQUIS = ['CONFIRMED', 'TERMINATED']

// Repli si l'API renvoie une valeur inconnue (enum ajoute cote serveur sans
// mise a jour du client) : on affiche la valeur brute plutot que de casser.
export function enumMeta(dict, value) {
  return dict[value] ?? { label: value ?? '-', tone: 'neutral' }
}
