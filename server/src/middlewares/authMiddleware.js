const { getUserFromToken } = require('../services/authService');

async function requireAuth(req, res, next) {
  const user = await getUserFromToken(req.headers.authorization);

  if (!user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  req.user = user;
  return next();
}

module.exports = { requireAuth };
