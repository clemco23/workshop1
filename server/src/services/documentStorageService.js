const crypto = require('crypto');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

let supabaseClient;

function getStorage() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  // Le fallback permet de fonctionner tout de suite avec le bucket project-media.
  // En production, il est preferable de creer un bucket prive `documents`.
  const bucket = process.env.SUPABASE_DOCUMENT_BUCKET || process.env.SUPABASE_PROJECT_MEDIA_BUCKET;

  if (!url || !secretKey || !bucket) {
    const error = new Error('CONFIGURATION_STORAGE_MANQUANTE');
    error.status = 503;
    throw error;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return { storage: supabaseClient.storage.from(bucket) };
}

function extensionFor(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension) return extension;
  return file.mimetype === 'application/pdf' ? '.pdf' : '.jpg';
}

function contentTypeFor(file) {
  if (file.mimetype && file.mimetype !== 'application/octet-stream') return file.mimetype;

  const types = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  };
  return types[extensionFor(file)] || 'application/octet-stream';
}

async function uploadDocument(userId, file) {
  const { storage } = getStorage();
  const fichierPath = `${userId}/documents/${crypto.randomUUID()}${extensionFor(file)}`;
  const { error } = await storage.upload(fichierPath, file.buffer, {
    contentType: contentTypeFor(file),
    upsert: false,
  });

  if (error) {
    const uploadError = new Error('UPLOAD_DOCUMENT_ECHOUE');
    uploadError.status = 502;
    throw uploadError;
  }

  return { fichierPath, mimeType: contentTypeFor(file), taille: file.size };
}

async function deleteDocument(fichierPath) {
  if (!fichierPath) return;
  const { storage } = getStorage();
  const { error } = await storage.remove([fichierPath]);
  if (error) console.error('Impossible de supprimer le document Storage :', error.message);
}

async function createDocumentUrl(fichierPath) {
  const { storage } = getStorage();
  const { data, error } = await storage.createSignedUrl(fichierPath, 60 * 60);
  if (error || !data?.signedUrl) {
    const urlError = new Error('LIEN_DOCUMENT_INDISPONIBLE');
    urlError.status = 502;
    throw urlError;
  }
  return data.signedUrl;
}

module.exports = { uploadDocument, deleteDocument, createDocumentUrl };
