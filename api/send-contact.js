export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://funkylevels.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const subjectLabels = {
    bug: 'Bug Report',
    abuse: 'Abuse Report',
    rgpd: 'GDPR Request',
    question: 'General Question',
    other: 'Other'
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: 'FunkyLevels Contact', email: 'noreply@funkylevels.com' },
        to: [{ email: 'contact@funkylevels.com', name: 'FunkyLevels' }],
        replyTo: { email, name },
        subject: `[FunkyLevels] ${subjectLabels[subject] || subject} — ${name}`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:600px;">
            <h2 style="color:#a040f0;">Nouveau message FunkyLevels</h2>
            <p><strong>De :</strong> ${name} (${email})</p>
            <p><strong>Sujet :</strong> ${subjectLabels[subject] || subject}</p>
            <hr>
            <p style="white-space:pre-wrap;">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
          </div>
        `
      })
    });

    if (response.ok) {
      return res.status(200).json({ ok: true });
    } else {
      const err = await response.json();
      return res.status(500).json({ error: err.message || 'Brevo error' });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
