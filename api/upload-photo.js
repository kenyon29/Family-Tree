import { requirePasscode } from './_lib/airtable.js';

// Airtable's attachment upload API lives on a separate host from the main
// REST API and takes the file as base64 directly (no multipart needed).
const CONTENT_API_BASE = 'https://content.airtable.com/v0';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    requirePasscode(req);
    const { recordId, filename, contentType, base64 } = req.body || {};
    if (!recordId || !filename || !contentType || !base64) {
      res.status(400).json({ error: 'recordId, filename, contentType and base64 are required.' });
      return;
    }
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!apiKey || !baseId) {
      res.status(500).json({ error: 'Server is missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID.' });
      return;
    }

    const url = `${CONTENT_API_BASE}/${baseId}/${recordId}/Photo/uploadAttachment`;
    const airtableRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: base64, filename, contentType }),
    });
    const data = await airtableRes.json();
    if (!airtableRes.ok) {
      res.status(airtableRes.status).json({ error: data?.error?.message || 'Airtable upload failed.' });
      return;
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Unexpected error' });
  }
}
