const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    const error = new Error('CONFIGURATION_BREVO_MANQUANTE');
    error.code = 'CONFIGURATION_BREVO_MANQUANTE';
    throw error;
  }

  return {
    apiKey,
    sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || 'Workshop' },
  };
}

async function sendVerificationCode(email, code) {
  const { apiKey, sender } = getBrevoConfig();
  const sandbox = process.env.BREVO_SANDBOX;
  const response = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender,
      to: [{ email }],
      subject: 'Votre code de connexion',
      textContent: `Votre code de connexion est : ${code}. Il expire dans 10 minutes.`,
      htmlContent: `<p>Votre code de connexion est :</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p><p>Il expire dans 10 minutes.</p>`,
      ...(sandbox ? { headers: { 'X-Sib-Sandbox': 'drop' } } : {}),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('Brevo a refusé l’envoi :', response.status, details);
    const error = new Error('ENVOI_EMAIL_ECHOUE');
    error.code = 'ENVOI_EMAIL_ECHOUE';
    throw error;
  }

  return response.json();
}

module.exports = { sendVerificationCode };
