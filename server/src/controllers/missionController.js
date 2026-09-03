const { prisma } = require('../config/prisma');
const { TYPES, STATUTS, missionData } = require('../services/missionValidationService');

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
