const { prisma } = require('../config/prisma');

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

async function listMissionsController(req, res, next) {
  try {
    const { type, statut, mois, client } = req.query;
    const where = { userId: req.user.id };

    if (type) {
      if (!TYPES.includes(type)) return res.status(400).json({ message: 'Type de mission invalide' });
      where.type = type;
    }

    if (statut) {
      if (!STATUTS.includes(statut)) return res.status(400).json({ message: 'Statut de mission invalide' });
      where.statut = statut;
    }

    if (client) where.clientProduction = { contains: client, mode: 'insensitive' };

    if (mois) {
      if (!/^\d{4}-\d{2}$/.test(mois)) return res.status(400).json({ message: 'Mois attendu au format YYYY-MM' });
      const start = new Date(`${mois}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      where.dateDebut = { gte: start, lt: end };
    }

    const missions = await prisma.mission.findMany({
      where,
      orderBy: { dateDebut: 'desc' },
    });

    return res.status(200).json(missions);
  } catch (error) {
    return next(error);
  }
}

async function getMissionController(req, res, next) {
  try {
    const mission = await prisma.mission.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { documents: true, projects: true },
    });

    if (!mission) return res.status(404).json({ message: 'Mission introuvable' });
    return res.status(200).json(mission);
  } catch (error) {
    return next(error);
  }
}

async function createMissionController(req, res, next) {
  try {
    const mission = await prisma.mission.create({
      data: { ...missionData(req.body), userId: req.user.id },
    });

    return res.status(201).json(mission);
  } catch (error) {
    return next(error);
  }
}

async function updateMissionController(req, res, next) {
  try {
    const existing = await prisma.mission.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Mission introuvable' });

    const data = missionData(req.body, { partial: true });
    const mission = await prisma.mission.update({ where: { id: existing.id }, data });

    return res.status(200).json(mission);
  } catch (error) {
    return next(error);
  }
}

async function deleteMissionController(req, res, next) {
  try {
    const existing = await prisma.mission.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Mission introuvable' });

    await prisma.mission.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listMissionsController,
  getMissionController,
  createMissionController,
  updateMissionController,
  deleteMissionController,
};
