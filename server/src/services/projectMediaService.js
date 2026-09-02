const crypto = require('crypto');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

let supabaseClient;

function getStorage() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_PROJECT_MEDIA_BUCKET;

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

  return { bucket, storage: supabaseClient.storage.from(bucket) };
}

function extensionFor(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension) return extension;
  if (file.mimetype === 'application/pdf') return '.pdf';
  if (file.mimetype.startsWith('image/')) return '.jpg';
  if (file.mimetype.startsWith('video/')) return '.mp4';
  return '';
}

function contentTypeFor(file) {
  if (file.mimetype && file.mimetype !== 'application/octet-stream') return file.mimetype;

  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
  };

  return types[extensionFor(file)] || 'application/octet-stream';
}

async function uploadProjectMedia(userId, file) {
  const { bucket, storage } = getStorage();
  const filePath = `${userId}/projects/${crypto.randomUUID()}${extensionFor(file)}`;
  const { error } = await storage.upload(filePath, file.buffer, {
    contentType: contentTypeFor(file),
    upsert: false,
  });

  if (error) {
    const uploadError = new Error('UPLOAD_MEDIA_ECHOUE');
    uploadError.status = 502;
    throw uploadError;
  }

  const { data } = storage.getPublicUrl(filePath);
  return { link: data.publicUrl, filePath };
}

function getStoragePath(link) {
  const { bucket } = getStorage();
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = link?.indexOf(marker);

  if (index === -1 || index === undefined) return null;
  return decodeURIComponent(link.slice(index + marker.length).split('?')[0]);
}

async function deleteProjectMedia(link) {
  const filePath = getStoragePath(link);
  if (!filePath) return;

  const { storage } = getStorage();
  const { error } = await storage.remove([filePath]);
  if (error) console.error('Impossible de supprimer le média Storage :', error.message);
}

module.exports = { uploadProjectMedia, deleteProjectMedia };
