export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { passcode } = req.body || {};
  const expected = process.env.EDITOR_PASSCODE;
  if (!expected) {
    res.status(500).json({ error: 'Server is missing the EDITOR_PASSCODE environment variable.' });
    return;
  }
  if (passcode && passcode === expected) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: 'Incorrect passcode.' });
  }
}
