const { prisma } = require('../config/prisma');

function positiveNumber(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} doit être supérieur à zéro`);
    error.status = 400;
    throw error;
  }

  return parsed;
}

function positiveInteger(value, fieldName) {
  const parsed = positiveNumber(value, fieldName);

  if (!Number.isInteger(parsed)) {
    const error = new Error(`${fieldName} doit être un entier`);
    error.status = 400;
    throw error;
  }

  return parsed;
}

// Jours de la semaine au format getUTCDay() : 0 = dimanche ... 6 = samedi.
// Les sept jours ne peuvent pas etre off : le defaut ne servirait plus qu'a
// produire des missions vides.
function joursSemaine(value, fieldName) {
  if (!Array.isArray(value)) {
    const error = new Error(`${fieldName} doit être une liste de jours`);
    error.status = 400;
    throw error;
  }

  const jours = value.map((jour) => {
    const parsed = Number(jour);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
      const error = new Error(`${fieldName} contient un jour invalide`);
      error.status = 400;
      throw error;
    }
    return parsed;
  });

  const uniques = [...new Set(jours)].sort((a, b) => a - b);

  if (uniques.length === 7) {
    const error = new Error(`${fieldName} ne peut pas couvrir les sept jours`);
    error.status = 400;
    throw error;
  }

  return uniques;
}

async function getSettingsController(req, res, next) {
  try {
    const settings = await prisma.configSeuil.upsert({
      where: { userId: req.user.id },
      update: {},
      create: { userId: req.user.id },
    });

    return res.status(200).json(settings);
  } catch (error) {
    return next(error);
  }
}

async function updateSettingsController(req, res, next) {
  try {
    const data = {};

    if (req.body.seuilHeuresAnnuel !== undefined) {
      data.seuilHeuresAnnuel = positiveInteger(req.body.seuilHeuresAnnuel, 'Le seuil annuel');
    }
    if (req.body.heuresJourDefaut !== undefined) {
      data.heuresJourDefaut = positiveNumber(req.body.heuresJourDefaut, 'Les heures par jour');
    }
    if (req.body.fenetreMois !== undefined) {
      data.fenetreMois = positiveInteger(req.body.fenetreMois, 'La fenêtre en mois');
    }
    if (req.body.joursOffDefaut !== undefined) {
      data.joursOffDefaut = joursSemaine(req.body.joursOffDefaut, 'Les jours non travaillés');
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Aucun paramètre à modifier' });
    }

    const settings = await prisma.configSeuil.upsert({
      where: { userId: req.user.id },
      update: data,
      create: { userId: req.user.id, ...data },
    });

    return res.status(200).json(settings);
  } catch (error) {
    return next(error);
  }
}

module.exports = { getSettingsController, updateSettingsController };
