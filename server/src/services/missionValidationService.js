// Validation du body d'une mission, isolee du controller pour etre testable sans
// Express ni base (voir ../../tests/missionValidationService.test.js). Un helper
// leve une Error portant un `status`, il ne repond jamais lui-meme.

const TYPES = ['INTERMITTENCE', 'FREELANCE'];
const STATUTS = ['PROPOSED', 'CONFIRMED', 'TERMINATED'];

function parseDate(value, fieldName) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} invalide`);
    error.status = 400;
    throw error;
  }
  return date;
}

// Jour de la semaine au format getUTCDay() : 0 = dimanche ... 6 = samedi. C'est
// la convention du schema (`jours_off`, `jours_off_defaut`) et du client, pour
// n'avoir aucune traduction a faire entre la base et l'ecran.
function parseJoursOff(value, fieldName) {
  if (value === null || value === undefined) return [];

  if (!Array.isArray(value)) {
    const error = new Error(`${fieldName} invalide`);
    error.status = 400;
    throw error;
  }

  const jours = value.map((jour) => {
    const number = Number(jour);
    if (!Number.isInteger(number) || number < 0 || number > 6) {
      const error = new Error(`${fieldName} invalide`);
      error.status = 400;
      throw error;
    }
    return number;
  });

  // Dedoublonne et ordonne : le stockage ne doit pas dependre de l'ordre des
  // clics dans le formulaire, sinon deux masques identiques se comparent mal.
  return [...new Set(jours)].sort((a, b) => a - b);
}

// Les exceptions ponctuelles sont ramenees a minuit UTC : ce sont des jours, pas
// des instants, et c'est par leur cle 'AAAA-MM-JJ' qu'elles sont comparees.
function parseJours(value, fieldName) {
  if (value === null || value === undefined) return [];

  if (!Array.isArray(value)) {
    const error = new Error(`${fieldName} invalide`);
    error.status = 400;
    throw error;
  }

  const cles = value.map((jour) => {
    const date = parseDate(jour, fieldName);
    return date.toISOString().slice(0, 10);
  });

  return [...new Set(cles)].sort().map((cle) => new Date(`${cle}T00:00:00.000Z`));
}

function parseNumber(value, fieldName) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(`${fieldName} invalide`);
    error.status = 400;
    throw error;
  }
  return number;
}

function missionData(body, { partial = false } = {}) {
  const data = {};

  if (!partial || body.clientProduction !== undefined) {
    if (!body.clientProduction || !body.clientProduction.trim()) {
      const error = new Error('Client ou production requis');
      error.status = 400;
      throw error;
    }
    data.clientProduction = body.clientProduction.trim();
  }

  if (!partial || body.type !== undefined) {
    if (!TYPES.includes(body.type)) {
      const error = new Error('Type de mission invalide');
      error.status = 400;
      throw error;
    }
    data.type = body.type;
  }

  if (!partial || body.statut !== undefined) {
    if (body.statut !== undefined && !STATUTS.includes(body.statut)) {
      const error = new Error('Statut de mission invalide');
      error.status = 400;
      throw error;
    }
    if (body.statut !== undefined) data.statut = body.statut;
  }

  if (!partial || body.dateDebut !== undefined) data.dateDebut = parseDate(body.dateDebut, 'Date de début');
  if (body.dateFin !== undefined) data.dateFin = body.dateFin ? parseDate(body.dateFin, 'Date de fin') : null;
  if (data.dateDebut && data.dateFin && data.dateFin < data.dateDebut) {
    const error = new Error('La date de fin doit être après la date de début');
    error.status = 400;
    throw error;
  }

  if (body.heures !== undefined) data.heures = parseNumber(body.heures, 'Heures');
  if (body.montantHt !== undefined) data.montantHt = parseNumber(body.montantHt, 'Montant HT');
  if (body.nbJours !== undefined) data.nbJours = parseNumber(body.nbJours, 'Nombre de jours');

  // Masque des jours travailles : la regle recurrente, puis les exceptions.
  // Le decompte, lui, reste au client (`src/lib/joursTravailles.js`).
  if (body.joursOff !== undefined) data.joursOff = parseJoursOff(body.joursOff, 'Jours non travaillés');
  if (body.datesExclues !== undefined) data.datesExclues = parseJours(body.datesExclues, 'Date exclue');
  if (body.datesIncluses !== undefined) data.datesIncluses = parseJours(body.datesIncluses, 'Date incluse');

  if (body.note !== undefined) data.note = body.note?.trim() || null;

  return data;
}

module.exports = { TYPES, STATUTS, parseDate, parseNumber, parseJoursOff, parseJours, missionData };
