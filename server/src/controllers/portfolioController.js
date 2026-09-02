const crypto = require('crypto');
const { prisma } = require('../config/prisma');

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function slugify(value) {
  const slug = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return slug || 'portfolio';
}

function publicUrl(slug) {
  const baseUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${baseUrl}/portfolio/${slug}`;
}

async function validateProjectIds(projectIds, userId) {
  if (!Array.isArray(projectIds)) throw invalid('projectIds doit être un tableau');
  const ids = [...new Set(projectIds)];
  const projects = await prisma.project.findMany({ where: { id: { in: ids }, userId }, select: { id: true } });
  if (projects.length !== ids.length) throw invalid('Un ou plusieurs projets sont introuvables');
  return ids;
}

function formatPortfolio(portfolio) {
  return { ...portfolio, publicUrl: publicUrl(portfolio.slug) };
}

async function createPortfolioController(req, res, next) {
  try {
    const { titrePage, projectIds = [], actif = true } = req.body;
    if (!titrePage?.trim()) throw invalid('Titre du portfolio requis');
    if (typeof actif !== 'boolean') throw invalid('actif doit être un booléen');

    const ids = await validateProjectIds(projectIds, req.user.id);
    const slug = `${slugify(titrePage)}-${crypto.randomBytes(4).toString('hex')}`;
    const portfolio = await prisma.portfolioPublic.create({
      data: {
        userId: req.user.id,
        titrePage: titrePage.trim(),
        slug,
        actif,
        projects: { create: ids.map((projetId, index) => ({ projetId, ordre: index + 1 })) },
      },
      include: { projects: { orderBy: { ordre: 'asc' }, include: { projet: true } } },
    });
    return res.status(201).json(formatPortfolio(portfolio));
  } catch (error) {
    return next(error);
  }
}

async function listPortfoliosController(req, res, next) {
  try {
    const portfolios = await prisma.portfolioPublic.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { projects: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(portfolios.map((portfolio) => ({
      ...formatPortfolio(portfolio), nbProjets: portfolio._count.projects,
    })));
  } catch (error) {
    return next(error);
  }
}

async function getPortfolioController(req, res, next) {
  try {
    const portfolio = await prisma.portfolioPublic.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { projects: { orderBy: { ordre: 'asc' }, include: { projet: true } } },
    });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio introuvable' });

    const selectedIds = portfolio.projects.map((link) => link.projetId);
    const projetsDisponibles = await prisma.project.findMany({
      where: { userId: req.user.id, id: { notIn: selectedIds } }, orderBy: { date: 'desc' },
    });
    return res.status(200).json({
      ...formatPortfolio(portfolio),
      projets: portfolio.projects.map((link) => ({ ordre: link.ordre, ...link.projet })),
      projetsDisponibles,
    });
  } catch (error) {
    return next(error);
  }
}

async function updatePortfolioController(req, res, next) {
  try {
    const existing = await prisma.portfolioPublic.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Portfolio introuvable' });

    const data = {};
    if (req.body.titrePage !== undefined) {
      if (!req.body.titrePage?.trim()) throw invalid('Titre du portfolio requis');
      data.titrePage = req.body.titrePage.trim();
    }
    if (req.body.actif !== undefined) {
      if (typeof req.body.actif !== 'boolean') throw invalid('actif doit être un booléen');
      data.actif = req.body.actif;
    }
    if (Object.keys(data).length === 0) throw invalid('Aucun paramètre à modifier');

    const portfolio = await prisma.portfolioPublic.update({ where: { id: existing.id }, data });
    return res.status(200).json(formatPortfolio(portfolio));
  } catch (error) {
    return next(error);
  }
}

async function updatePortfolioProjectsController(req, res, next) {
  try {
    const existing = await prisma.portfolioPublic.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Portfolio introuvable' });

    const ids = await validateProjectIds(req.body.projectIds, req.user.id);
    await prisma.$transaction([
      prisma.portfolioPublicProjet.deleteMany({ where: { portfolioPublicId: existing.id } }),
      prisma.portfolioPublicProjet.createMany({
        data: ids.map((projetId, index) => ({ portfolioPublicId: existing.id, projetId, ordre: index + 1 })),
      }),
    ]);
    return getPortfolioController(req, res, next);
  } catch (error) {
    return next(error);
  }
}

async function deletePortfolioController(req, res, next) {
  try {
    const existing = await prisma.portfolioPublic.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Portfolio introuvable' });
    await prisma.portfolioPublic.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function getPublicPortfolioController(req, res, next) {
  try {
    const portfolio = await prisma.portfolioPublic.findFirst({
      where: { slug: req.params.slug, actif: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
        projects: { orderBy: { ordre: 'asc' }, include: { projet: true } },
      },
    });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio introuvable' });

    return res.status(200).json({
      slug: portfolio.slug,
      titrePage: portfolio.titrePage,
      auteur: [portfolio.user.firstName, portfolio.user.lastName].filter(Boolean).join(' ') || 'Portfolio',
      projets: portfolio.projects.map(({ ordre, projet }) => ({
        ordre, titre: projet.titre, description: projet.description, tag: projet.tag,
        type: projet.type, date: projet.date, link: projet.link,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPortfolioController, listPortfoliosController, getPortfolioController,
  updatePortfolioController, updatePortfolioProjectsController, deletePortfolioController,
  getPublicPortfolioController,
};
