const { prisma } = require('../config/prisma');

async function getDashboardController(req, res, next) {
  try {
    const [configSeuil, missions, documents] = await Promise.all([
      prisma.configSeuil.upsert({
        where: { userId: req.user.id },
        update: {},
        create: { userId: req.user.id },
      }),
      prisma.mission.findMany({
        where: { userId: req.user.id },
        orderBy: { dateDebut: 'desc' },
      }),
      prisma.document.findMany({
        where: { userId: req.user.id },
        orderBy: { uploadedAt: 'desc' },
      }),
    ]);

    return res.status(200).json({
      user: req.user,
      configSeuil,
      missions,
      documents,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getDashboardController };
