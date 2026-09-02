const { prisma } = require('../config/prisma');
const { uploadProjectMedia, deleteProjectMedia } = require('../services/projectMediaService');

const TYPES = ['IMAGE', 'PDF', 'VIDEO', 'LINK'];
const TAGS = ['PRO', 'PERSONAL'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function parseDate(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw invalid('Date invalide');
  return date;
}

function parseLink(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw invalid('Lien invalide');
  }
}

function validateFile(file, type) {
  if (!file) return;

  const extension = require('path').extname(file.originalname).toLowerCase();
  const valid = (type === 'IMAGE' && (file.mimetype.startsWith('image/') || IMAGE_EXTENSIONS.includes(extension)))
    || (type === 'PDF' && (file.mimetype === 'application/pdf' || extension === '.pdf'))
    || (type === 'VIDEO' && (file.mimetype.startsWith('video/') || VIDEO_EXTENSIONS.includes(extension)));

  if (!valid) throw invalid(`Le fichier ne correspond pas au type ${type}`);
}

async function validateMissionId(missionId, userId) {
  if (!missionId) return null;

  const mission = await prisma.mission.findFirst({ where: { id: missionId, userId } });
  if (!mission) throw invalid('Mission introuvable');
  return mission.id;
}

async function projectData(body, userId, partial = false) {
  const data = {};

  if (!partial || body.titre !== undefined) {
    if (!body.titre?.trim()) throw invalid('Titre requis');
    data.titre = body.titre.trim();
  }
  if (!partial || body.tag !== undefined) {
    if (!TAGS.includes(body.tag)) throw invalid('Tag de projet invalide');
    data.tag = body.tag;
  }
  if (!partial || body.type !== undefined) {
    if (!TYPES.includes(body.type)) throw invalid('Type de projet invalide');
    data.type = body.type;
  }
  if (!partial || body.date !== undefined) data.date = parseDate(body.date);
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.missionId !== undefined) data.missionId = await validateMissionId(body.missionId, userId);
  if (body.link !== undefined && body.link !== '') data.link = parseLink(body.link);

  return data;
}

async function listProjectsController(req, res, next) {
  try {
    const { tag, type } = req.query;
    const where = { userId: req.user.id };

    if (tag) {
      if (!TAGS.includes(tag)) return res.status(400).json({ message: 'Tag de projet invalide' });
      where.tag = tag;
    }
    if (type) {
      if (!TYPES.includes(type)) return res.status(400).json({ message: 'Type de projet invalide' });
      where.type = type;
    }

    const projects = await prisma.project.findMany({ where, orderBy: { date: 'desc' } });
    return res.status(200).json(projects);
  } catch (error) {
    return next(error);
  }
}

async function getProjectController(req, res, next) {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { mission: true },
    });

    if (!project) return res.status(404).json({ message: 'Projet introuvable' });
    return res.status(200).json(project);
  } catch (error) {
    return next(error);
  }
}

async function createProjectController(req, res, next) {
  let uploadedMedia;

  try {
    const data = await projectData(req.body, req.user.id);
    if (req.file) {
      if (data.type === 'LINK') throw invalid('Un projet de type LINK ne reçoit pas de fichier');
      validateFile(req.file, data.type);
      uploadedMedia = await uploadProjectMedia(req.user.id, req.file);
      data.link = uploadedMedia.link;
    }
    if (!data.link) throw invalid('Un lien ou un fichier est requis');

    const project = await prisma.project.create({ data: { ...data, userId: req.user.id } });
    return res.status(201).json(project);
  } catch (error) {
    if (uploadedMedia) await deleteProjectMedia(uploadedMedia.link);
    return next(error);
  }
}

async function updateProjectController(req, res, next) {
  let uploadedMedia;

  try {
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Projet introuvable' });

    const data = await projectData(req.body, req.user.id, true);
    const finalType = data.type || existing.type;
    if (req.file) {
      if (finalType === 'LINK') throw invalid('Un projet de type LINK ne reçoit pas de fichier');
      validateFile(req.file, finalType);
      uploadedMedia = await uploadProjectMedia(req.user.id, req.file);
      data.link = uploadedMedia.link;
    }

    const project = await prisma.project.update({ where: { id: existing.id }, data });
    if (uploadedMedia && existing.link !== project.link) await deleteProjectMedia(existing.link);
    return res.status(200).json(project);
  } catch (error) {
    if (uploadedMedia) await deleteProjectMedia(uploadedMedia.link);
    return next(error);
  }
}

async function deleteProjectController(req, res, next) {
  try {
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Projet introuvable' });

    await prisma.project.delete({ where: { id: existing.id } });
    await deleteProjectMedia(existing.link);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listProjectsController,
  getProjectController,
  createProjectController,
  updateProjectController,
  deleteProjectController,
};
