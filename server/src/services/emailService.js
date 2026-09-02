const nodemailer = require('nodemailer');

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    const error = new Error('CONFIGURATION_GMAIL_MANQUANTE');
    error.code = 'CONFIGURATION_GMAIL_MANQUANTE';
    throw error;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendVerificationCode(email, code) {
  const transporter = getTransporter();

  return transporter.sendMail({
    from: `"Editly" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Votre code de connexion',
    text: `Votre code de connexion est : ${code}. Il expire dans 10 minutes.`,
    html: `<p>Votre code de connexion est :</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p><p>Il expire dans 10 minutes.</p>`,
  });
}

module.exports = { sendVerificationCode };
