const path = require('path');
const { prisma } = require('../config/prisma');
const { uploadDocument, deleteDocument, createDocumentUrl } = require('../services/documentStorageService');

const CATEGORIES = ['CONTRACT', 'EMPLOYER_ATTESTATION', 'QUOTE', 'INVOICE', 'OTHER'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validateFile(file) {
  if (!file) throw invalid('Fichier requis');
  const extension = path.extname(file.originalname).toLowerCase();
  const valid = file.mimetype === 'application/pdf'
    || file.mimetype.startsWith('image/')
    || extension === '.pdf'
    || IMAGE_EXTENSIONS.includes(extension);

  if (!valid) throw invalid('Seuls les PDF et les images sont acceptes');
}

async function validateMissionId(missionId, userId) {
  if (!missionId) return null;
  const mission = await prisma.mission.findFirst({ where: { id: missionId, userId } });
  if (!mission) throw invalid('Mission introuvable');
  return mission.id;
}

async function documentData(body, userId, partial = false) {
  const data = {};
  if (!partial || body.categorie !== undefined) {
    if (!CATEGORIES.includes(body.categorie)) throw invalid('Categorie de document invalide');
    data.categorie = body.categorie;
  }
  if (body.missionId !== undefined) data.missionId = await validateMissionId(body.missionId, userId);
  return data;
}

async function listDocumentsController(req, res, next) {
  try {
    const where = { userId: req.user.id };
    const { categorie, missionId } = req.query;
    if (categorie) {
      if (!CATEGORIES.includes(categorie)) return res.status(400).json({ message: 'Categorie de document invalide' });
      where.categorie = categorie;
    }
    if (missionId) where.missionId = missionId === 'aucune' ? null : missionId;

    const documents = await prisma.document.findMany({
      where,
      include: { mission: true },
      orderBy: { uploadedAt: 'desc' },
    });
    return res.status(200).json(documents);
  } catch (error) {
    return next(error);
  }
}

async function getDocumentController(req, res, next) {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { mission: true },
    });
    if (!document) return res.status(404).json({ message: 'Document introuvable' });
    return res.status(200).json(document);
  } catch (error) {
    return next(error);
  }
}

async function createDocumentController(req, res, next) {
  let uploaded;
  try {
    validateFile(req.file);
    const data = await documentData(req.body, req.user.id);
    uploaded = await uploadDocument(req.user.id, req.file);
    const document = await prisma.document.create({
      data: {
        ...data,
        ...uploaded,
        userId: req.user.id,
        nomOriginal: req.file.originalname,
      },
      include: { mission: true },
    });
    return res.status(201).json(document);
  } catch (error) {
    if (uploaded) await deleteDocument(uploaded.fichierPath);
    return next(error);
  }
}

async function updateDocumentController(req, res, next) {
  let uploaded;
  try {
    const existing = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Document introuvable' });

    const data = await documentData(req.body, req.user.id, true);
    if (req.file) {
      validateFile(req.file);
      uploaded = await uploadDocument(req.user.id, req.file);
      Object.assign(data, uploaded, { nomOriginal: req.file.originalname });
    }

    const document = await prisma.document.update({
      where: { id: existing.id },
      data,
      include: { mission: true },
    });
    if (uploaded) await deleteDocument(existing.fichierPath);
    return res.status(200).json(document);
  } catch (error) {
    if (uploaded) await deleteDocument(uploaded.fichierPath);
    return next(error);
  }
}

async function getDocumentUrlController(req, res, next) {
  try {
    const document = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!document) return res.status(404).json({ message: 'Document introuvable' });
    return res.status(200).json({ url: await createDocumentUrl(document.fichierPath) });
  } catch (error) {
    return next(error);
  }
}

async function deleteDocumentController(req, res, next) {
  try {
    const document = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!document) return res.status(404).json({ message: 'Document introuvable' });
    await prisma.document.delete({ where: { id: document.id } });
    await deleteDocument(document.fichierPath);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listDocumentsController,
  getDocumentController,
  createDocumentController,
  updateDocumentController,
  getDocumentUrlController,
  deleteDocumentController,
};
