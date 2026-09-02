const { requestCode, verifyCode, getUserFromToken } = require('../services/authService');

async function requestCodeController(req, res) {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Email invalide' });
    }

    const { user } = await requestCode(email);

    return res.status(200).json({
      success: true,
      message: 'Code de vérification envoyé',
      email: user.email,
    });
  } catch (error) {
    if (error.code === 'CONFIGURATION_GMAIL_MANQUANTE') {
      return res.status(503).json({ message: 'Service email non configuré' });
    }

    if (error.code === 'ENVOI_EMAIL_ECHOUE') {
      return res.status(502).json({ message: 'Impossible d’envoyer le code par email' });
    }

    console.error('Erreur requestCodeController :', error.message);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function verifyCodeController(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email et code requis' });
    }

    const result = await verifyCode(email, code);

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      ...result,
    });
  } catch (error) {
    if (error.message === 'UTILISATEUR_INTRouvABLE') {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (error.message === 'CODE_EXPIRE' || error.message === 'CODE_INVALIDE') {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function meController(req, res) {
  const user = await getUserFromToken(req.headers.authorization);

  if (!user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  return res.status(200).json({ user });
}

module.exports = {
  requestCodeController,
  verifyCodeController,
  meController,
};
