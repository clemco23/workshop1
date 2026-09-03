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
  if (body.note !== undefined) data.note = body.note?.trim() || null;

  return data;
}

module.exports = { TYPES, STATUTS, parseDate, parseNumber, missionData };
