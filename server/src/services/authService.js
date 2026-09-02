const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');
const { sendVerificationCode } = require('./emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// `identite` ({ firstName, lastName }) vient du formulaire d'inscription et
// n'est appliquee qu'a **la creation** du compte : cet appel est aussi celui de
// la connexion, donc écraser les noms a chaque demande de code laisserait
// n'importe qui renommer un compte existant en connaissant juste son email —
// sans jamais avoir a lire le code. Renommer un compte deja cree passera par
// une route de profil authentifiee.
async function requestCode(email, identite = {}) {
  const normalizedEmail = email.trim().toLowerCase();

  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        firstName: identite.firstName ?? null,
        lastName: identite.lastName ?? null,
      },
    });
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.emailVerificationCode.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const delivery = await sendVerificationCode(user.email, code);

  return { user, messageId: delivery.messageId };
}

async function verifyCode(email, code) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    throw new Error('UTILISATEUR_INTRouvABLE');
  }

  const validCode = await prisma.emailVerificationCode.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!validCode) {
    throw new Error('CODE_EXPIRE');
  }

  const isValid = await bcrypt.compare(code, validCode.codeHash);

  if (!isValid) {
    throw new Error('CODE_INVALIDE');
  }

  await prisma.emailVerificationCode.update({
    where: { id: validCode.id },
    data: { usedAt: new Date() },
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
}

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

module.exports = {
  requestCode,
  verifyCode,
  generateToken,
  getUserFromToken,
};
