// Donnees simulees du dashboard, calquees sur ce que l'API renverra :
//   - noms de champs en camelCase (Prisma mappe client_production -> clientProduction),
//   - enums en chaines ('CONFIRMED', 'INTERMITTENCE'),
//   - Decimal serialises en *chaines* ('40.00'), dates en ISO 8601,
//   - uuid en id.
// Le jour ou `/api/dashboard` existe, il suffit de basculer VITE_USE_MOCKS=false :
// aucune autre ligne du client ne change (voir src/api/dashboard.js).

// Les dates sont relatives au mois courant pour que la demo ne se perime pas.
const maintenant = new Date()

function jour(moisOffset, numeroJour) {
  return new Date(
    Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + moisOffset, numeroJour),
  ).toISOString()
}

const USER_ID = '3f1a8c7e-0b4d-4a91-9c2f-1e5d6b8a4c30'

export const dashboardMock = {
  user: {
    id: USER_ID,
    firstName: 'Theo',
    lastName: 'Marchand',
    email: 'theo@yuccan.fr',
    createdAt: jour(-14, 12),
  },

  // config_seuil : 507 h est le seuil d'intermittence, valeur par defaut du schema.
  configSeuil: {
    id: 'c0a1b2c3-d4e5-4f60-8a91-2b3c4d5e6f70',
    userId: USER_ID,
    seuilHeuresAnnuel: 507,
    heuresJourDefaut: '8',
    fenetreMois: 12,
  },

  missions: [
    {
      id: 'm1000000-0000-4000-8000-000000000001',
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
    },
    {
      id: 'm1000000-0000-4000-8000-000000000002',
      userId: USER_ID,
      clientProduction: 'Cie du Lys',
      type: 'INTERMITTENCE',
      dateDebut: jour(0, 14),
      dateFin: jour(0, 18),
      statut: 'PROPOSED', // proposee : ne compte pas dans le seuil ni le CA
      heures: null,
      montantHt: '1500.00',
      nbJours: '5.00',
      note: 'En attente de confirmation du planning.',
    },
    {
      id: 'm1000000-0000-4000-8000-000000000003',
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
    },
    {
      id: 'm1000000-0000-4000-8000-000000000004',
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
    },
    {
      id: 'm1000000-0000-4000-8000-000000000005',
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
    },
    {
      id: 'm1000000-0000-4000-8000-000000000006',
      userId: USER_ID,
      clientProduction: 'Sowen',
      type: 'FREELANCE',
      dateDebut: jour(-3, 1),
      dateFin: jour(-3, 28),
      statut: 'TERMINATED',
      heures: '60.00',
      montantHt: '7200.00',
      nbJours: null,
      note: null,
    },
    {
      id: 'm1000000-0000-4000-8000-000000000007',
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
    },
    {
      id: 'm1000000-0000-4000-8000-000000000008',
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
    },
    {
      id: 'm1000000-0000-4000-8000-000000000009',
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
    },
    {
      id: 'm1000000-0000-4000-8000-000000000010',
      userId: USER_ID,
      clientProduction: 'Atelier Nord',
      type: 'INTERMITTENCE',
      // Hors de la fenetre glissante de 12 mois : sert a verifier que le filtre
      // du seuil l'exclut bien.
      dateDebut: jour(-15, 2),
      dateFin: jour(-15, 20),
      statut: 'TERMINATED',
      heures: '90.00',
      montantHt: '5900.00',
      nbJours: '12.00',
      note: null,
    },
  ],

  documents: [
    {
      id: 'd1000000-0000-4000-8000-000000000001',
      userId: USER_ID,
      missionId: 'm1000000-0000-4000-8000-000000000003',
      categorie: 'CONTRACT',
      fichierPath: `${USER_ID}/contrats/contrat-france-tv.pdf`,
      nomOriginal: 'Contrat_FranceTV.pdf',
      taille: 284512,
      mimeType: 'application/pdf',
      uploadedAt: jour(-1, 26),
    },
    {
      id: 'd1000000-0000-4000-8000-000000000002',
      userId: USER_ID,
      missionId: 'm1000000-0000-4000-8000-000000000004',
      categorie: 'INVOICE',
      fichierPath: `${USER_ID}/factures/facture-studio-vela.pdf`,
      nomOriginal: 'Facture_StudioVela.pdf',
      taille: 132004,
      mimeType: 'application/pdf',
      uploadedAt: jour(-1, 22),
    },
    {
      id: 'd1000000-0000-4000-8000-000000000003',
      userId: USER_ID,
      missionId: 'm1000000-0000-4000-8000-000000000005',
      categorie: 'EMPLOYER_ATTESTATION',
      fichierPath: `${USER_ID}/aem/aem-radio-ouest.pdf`,
      nomOriginal: 'AEM_RadioOuest.pdf',
      taille: 98301,
      mimeType: 'application/pdf',
      uploadedAt: jour(-2, 12),
    },
    {
      id: 'd1000000-0000-4000-8000-000000000004',
      userId: USER_ID,
      missionId: null, // mission_id est nullable
      categorie: 'QUOTE',
      fichierPath: `${USER_ID}/devis/devis-sowen.pdf`,
      nomOriginal: 'Devis_Sowen.pdf',
      taille: 45120,
      mimeType: 'application/pdf',
      uploadedAt: jour(-3, 28),
    },
  ],
}

export default dashboardMock
