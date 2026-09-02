// Jeu de donnees simule unique : il tient le role de la base pour un seul
// utilisateur. Tous les modules de src/api/ y puisent, de sorte qu'une mission
// vue depuis le dashboard, la liste des missions ou un document lie soit
// exactement la meme ligne — pas de mocks par page qui divergent.
//
// Conventions calquees sur ce que renverra l'API (cf. server/prisma/schema.prisma) :
//   - camelCase (client_production -> clientProduction),
//   - enums en chaines ('CONFIRMED'), Decimal en *chaines* ('40.00'),
//   - dates ISO 8601, ids en uuid, champs nullables reellement a null.

// Dates relatives au mois courant pour que la demo ne se perime pas.
const maintenant = new Date()

function jour(moisOffset, numeroJour) {
  return new Date(
    Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + moisOffset, numeroJour),
  ).toISOString()
}

export const USER_ID = '3f1a8c7e-0b4d-4a91-9c2f-1e5d6b8a4c30'

const M = (n) => `m1000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`
const D = (n) => `d1000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`
const P = (n) => `p1000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`

export const user = {
  id: USER_ID,
  firstName: 'Theo',
  lastName: 'Marchand',
  email: 'theo@yuccan.fr',
  createdAt: jour(-14, 12),
}

// Code de connexion accepte tant que les mocks sont actifs : aucun mail n'est
// envoye, il faut donc une valeur connue pour traverser /login -> /verify-code.
// Cote serveur c'est une ligne de email_verification_code, tiree au hasard et
// stockee en bcrypt — rien de tout ca n'est simule ici.
export const CODE_MOCK = '000000'

// config_seuil : 507 h est le seuil d'intermittence, valeur par defaut du schema.
export const configSeuil = {
  id: 'c0a1b2c3-d4e5-4f60-8a91-2b3c4d5e6f70',
  userId: USER_ID,
  seuilHeuresAnnuel: 507,
  heuresJourDefaut: '8',
  fenetreMois: 12,
  createdAt: jour(-14, 12),
  updatedAt: jour(-2, 3),
}

export const missions = [
  {
    id: M(1),
    userId: USER_ID,
    clientProduction: 'Radio Ouest',
    type: 'INTERMITTENCE',
    dateDebut: jour(0, 1),
    dateFin: jour(0, 4),
    statut: 'CONFIRMED',
    heures: null, // heures inconnues : derivees de nbJours x heuresJourDefaut
    montantHt: '1800.00',
    nbJours: '4.00',
    note: null,
    createdAt: jour(-1, 18),
    updatedAt: jour(-1, 18),
  },
  {
    id: M(2),
    userId: USER_ID,
    clientProduction: 'Cie du Lys',
    type: 'INTERMITTENCE',
    dateDebut: jour(0, 14),
    dateFin: jour(0, 18),
    statut: 'PROPOSED', // proposee : ne compte ni dans le seuil ni dans le CA
    heures: null,
    montantHt: '1500.00',
    nbJours: '5.00',
    note: 'En attente de confirmation du planning.',
    createdAt: jour(0, 2),
    updatedAt: jour(0, 2),
  },
  {
    id: M(3),
    userId: USER_ID,
    clientProduction: 'France Televisions',
    type: 'INTERMITTENCE',
    dateDebut: jour(-1, 24),
    dateFin: jour(-1, 28),
    statut: 'TERMINATED',
    heures: '40.00',
    montantHt: '2400.00',
    nbJours: '5.00',
    note: null,
    createdAt: jour(-2, 15),
    updatedAt: jour(-1, 29),
  },
  {
    id: M(4),
    userId: USER_ID,
    clientProduction: 'Studio Vela',
    type: 'FREELANCE',
    dateDebut: jour(-1, 10),
    dateFin: jour(-1, 21),
    statut: 'TERMINATED',
    heures: null,
    montantHt: '4800.00',
    nbJours: '10.00',
    note: null,
    createdAt: jour(-2, 4),
    updatedAt: jour(-1, 22),
  },
  {
    id: M(5),
    userId: USER_ID,
    clientProduction: 'Radio Ouest',
    type: 'INTERMITTENCE',
    dateDebut: jour(-2, 2),
    dateFin: jour(-2, 10),
    statut: 'TERMINATED',
    heures: '56.00',
    montantHt: '3100.00',
    nbJours: '7.00',
    note: null,
    createdAt: jour(-3, 20),
    updatedAt: jour(-2, 11),
  },
  {
    id: M(6),
    userId: USER_ID,
    clientProduction: 'Sowen',
    type: 'FREELANCE',
    dateDebut: jour(-3, 1),
    dateFin: jour(-3, 28),
    statut: 'TERMINATED',
    heures: '60.00',
    montantHt: '7200.00',
    nbJours: null,
    note: 'Forfait mensuel, hors intermittence.',
    createdAt: jour(-4, 12),
    updatedAt: jour(-3, 29),
  },
  {
    id: M(7),
    userId: USER_ID,
    clientProduction: 'Atelier Nord',
    type: 'FREELANCE',
    dateDebut: jour(-5, 13),
    dateFin: jour(-5, 24),
    statut: 'TERMINATED',
    heures: '76.00',
    montantHt: '4100.00',
    nbJours: null,
    note: null,
    createdAt: jour(-6, 2),
    updatedAt: jour(-5, 25),
  },
  {
    id: M(8),
    userId: USER_ID,
    clientProduction: 'France Televisions',
    type: 'INTERMITTENCE',
    dateDebut: jour(-7, 9),
    dateFin: jour(-7, 20),
    statut: 'TERMINATED',
    heures: '88.00',
    montantHt: '5200.00',
    nbJours: '11.00',
    note: null,
    createdAt: jour(-8, 1),
    updatedAt: jour(-7, 21),
  },
  {
    id: M(9),
    userId: USER_ID,
    clientProduction: 'Theatre des Halles',
    type: 'INTERMITTENCE',
    dateDebut: jour(-10, 3),
    dateFin: jour(-10, 21),
    statut: 'TERMINATED',
    heures: '60.00',
    montantHt: '5600.00',
    nbJours: '8.00',
    note: null,
    createdAt: jour(-11, 5),
    updatedAt: jour(-10, 22),
  },
  {
    id: M(10),
    userId: USER_ID,
    clientProduction: 'Atelier Nord',
    type: 'INTERMITTENCE',
    // Hors de la fenetre glissante de 12 mois : verifie que le filtre du seuil
    // l'exclut bien.
    dateDebut: jour(-15, 2),
    dateFin: jour(-15, 20),
    statut: 'TERMINATED',
    heures: '90.00',
    montantHt: '5900.00',
    nbJours: '12.00',
    note: null,
    createdAt: jour(-16, 8),
    updatedAt: jour(-15, 21),
  },
  {
    id: M(11),
    userId: USER_ID,
    clientProduction: 'Cie du Lys',
    type: 'INTERMITTENCE',
    // date_fin est nullable : mission ouverte, sans fin connue.
    dateDebut: jour(-4, 6),
    dateFin: null,
    statut: 'CONFIRMED',
    heures: null,
    montantHt: null, // montant_ht est nullable aussi
    nbJours: null,
    note: 'Rappel : demander le contrat.',
    createdAt: jour(-4, 6),
    updatedAt: jour(-4, 6),
  },
]

export const documents = [
  {
    id: D(1),
    userId: USER_ID,
    missionId: M(3),
    categorie: 'CONTRACT',
    fichierPath: `${USER_ID}/contrats/contrat-france-tv.pdf`,
    nomOriginal: 'Contrat_FranceTV.pdf',
    taille: 284512,
    mimeType: 'application/pdf',
    uploadedAt: jour(-1, 26),
  },
  {
    id: D(2),
    userId: USER_ID,
    missionId: M(4),
    categorie: 'INVOICE',
    fichierPath: `${USER_ID}/factures/facture-studio-vela.pdf`,
    nomOriginal: 'Facture_StudioVela.pdf',
    taille: 132004,
    mimeType: 'application/pdf',
    uploadedAt: jour(-1, 22),
  },
  {
    id: D(3),
    userId: USER_ID,
    missionId: M(5),
    categorie: 'EMPLOYER_ATTESTATION',
    fichierPath: `${USER_ID}/aem/aem-radio-ouest.pdf`,
    nomOriginal: 'AEM_RadioOuest.pdf',
    taille: 98301,
    mimeType: 'application/pdf',
    uploadedAt: jour(-2, 12),
  },
  {
    id: D(4),
    userId: USER_ID,
    missionId: null, // mission_id est nullable
    categorie: 'QUOTE',
    fichierPath: `${USER_ID}/devis/devis-sowen.pdf`,
    nomOriginal: 'Devis_Sowen.pdf',
    taille: 45120,
    mimeType: 'application/pdf',
    uploadedAt: jour(-3, 28),
  },
  {
    id: D(5),
    userId: USER_ID,
    missionId: M(8),
    categorie: 'CONTRACT',
    fichierPath: `${USER_ID}/contrats/contrat-france-tv-hiver.pdf`,
    nomOriginal: 'Contrat_FranceTV_hiver.pdf',
    taille: 261900,
    mimeType: 'application/pdf',
    uploadedAt: jour(-7, 8),
  },
  {
    id: D(6),
    userId: USER_ID,
    missionId: null,
    categorie: 'OTHER',
    // Un non-PDF, pour verifier l'affichage par mime_type.
    fichierPath: `${USER_ID}/divers/plan-lumiere.png`,
    nomOriginal: 'plan-lumiere.png',
    taille: 1834000,
    mimeType: 'image/png',
    uploadedAt: jour(-5, 19),
  },
]

// Le schema ne stocke qu'un seul media par fiche : `type` (ProjectType) + `link`.
// `medias` n'existe pas en base — il anticipe la table `projet_media` (type, url |
// fichier_path, titre, ordre) pour les fiches qui montrent plusieurs pieces. Le
// client lit toujours `mediasProjet()`, qui prend `medias` s'il est la et retombe
// sinon sur `{ type, link }` : d'ou des fiches des deux formes dans ce jeu.
export const projets = [
  {
    id: P(1),
    userId: USER_ID,
    missionId: M(9),
    titre: 'Captation live — Cie du Lys',
    description: 'Captation 4 cameras du spectacle "Nord", montage et etalonnage.',
    tag: 'PRO',
    type: 'VIDEO',
    date: jour(-10, 21),
    link: 'https://vimeo.com/000000001',
    medias: [
      { type: 'VIDEO', url: 'https://vimeo.com/000000001', titre: 'Captation integrale' },
      { type: 'IMAGE', url: 'https://images.example.com/lys-plateau.jpg', titre: 'Plateau' },
      { type: 'PDF', url: 'https://files.example.com/lys-dossier-presse.pdf', titre: 'Dossier de presse' },
    ],
    createdAt: jour(-10, 25),
  },
  {
    id: P(2),
    userId: USER_ID,
    missionId: M(6),
    titre: 'Clip "Halogene"',
    description: null, // description est nullable
    tag: 'PRO',
    type: 'VIDEO',
    date: jour(-3, 24),
    link: 'https://vimeo.com/000000002',
    createdAt: jour(-3, 26),
  },
  {
    id: P(3),
    userId: USER_ID,
    missionId: M(5),
    titre: 'Documentaire court — Radio Ouest',
    description: 'Format 12 minutes diffuse en ligne.',
    tag: 'PRO',
    type: 'VIDEO',
    date: jour(-2, 10),
    link: 'https://vimeo.com/000000003',
    medias: [
      { type: 'VIDEO', url: 'https://vimeo.com/000000003' },
      // Sans `type` : il est devine a l'URL par typeMediaDepuisUrl().
      { url: 'https://www.radio-ouest.example/article-doc-12min', titre: "L'article" },
    ],
    createdAt: jour(-2, 14),
  },
  {
    id: P(4),
    userId: USER_ID,
    missionId: null, // projet perso, sans mission rattachee
    titre: 'Essai lumiere — nuit',
    description: 'Test de sources LED en basse lumiere.',
    tag: 'PERSONAL',
    type: 'IMAGE',
    date: jour(-6, 8),
    link: 'https://vimeo.com/000000004',
    medias: [
      { type: 'IMAGE', url: 'https://images.example.com/essai-led-01.jpg', titre: 'LED 3200K' },
      { type: 'IMAGE', url: 'https://images.example.com/essai-led-02.jpg', titre: 'LED 5600K' },
    ],
    createdAt: jour(-6, 9),
  },
  {
    id: P(5),
    userId: USER_ID,
    missionId: M(8),
    titre: 'Teaser festival',
    description: 'Teaser 40 s pour la campagne 2026.',
    tag: 'PRO',
    type: 'VIDEO',
    date: jour(-7, 20),
    link: 'https://vimeo.com/000000005',
    createdAt: jour(-7, 22),
  },
]

// Plusieurs pages publiques par utilisateur : c'est le slug qui est unique, pas
// le user (cf. server/prisma/schema.prisma). Une page en ligne et une hors ligne,
// pour que les deux etats soient couverts — un portfolio `actif: false` doit
// repondre 404 en public, pas une page vide.
export const portfolios = [
  {
    id: 'f0e1d2c3-b4a5-4968-8776-5a4b3c2d1e00',
    userId: USER_ID,
    slug: 'theo-marchand',
    titrePage: 'Theo Marchand — chef operateur',
    actif: true,
    createdAt: jour(-9, 14),
  },
  {
    id: 'f0e1d2c3-b4a5-4968-8776-5a4b3c2d1e01',
    userId: USER_ID,
    slug: 'theo-marchand-doc',
    titrePage: null, // titre_page est nullable : le slug sert alors de titre
    actif: false,
    createdAt: jour(-4, 3),
  },
]

// Table de jonction : quels projets figurent sur le portfolio, et dans quel ordre.
export const portfolioProjets = [
  { id: 'aa000000-0000-4000-8000-000000000001', portfolioPublicId: portfolios[0].id, projetId: P(1), ordre: 1 },
  { id: 'aa000000-0000-4000-8000-000000000002', portfolioPublicId: portfolios[0].id, projetId: P(5), ordre: 2 },
  { id: 'aa000000-0000-4000-8000-000000000003', portfolioPublicId: portfolios[0].id, projetId: P(2), ordre: 3 },
  // Un meme projet peut figurer dans deux portfolios, a des positions differentes.
  { id: 'aa000000-0000-4000-8000-000000000004', portfolioPublicId: portfolios[1].id, projetId: P(3), ordre: 1 },
  { id: 'aa000000-0000-4000-8000-000000000005', portfolioPublicId: portfolios[1].id, projetId: P(1), ordre: 2 },
]

export const db = {
  user,
  configSeuil,
  missions,
  documents,
  projets,
  portfolios,
  portfolioProjets,
}

export default db
