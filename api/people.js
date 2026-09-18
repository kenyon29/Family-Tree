import { listAllRecords, createRecord, updateRecord, requirePasscode } from './_lib/airtable.js';

const TABLE = 'People';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const records = await listAllRecords(TABLE);
      res.status(200).json({ records });
      return;
    }

    if (req.method === 'POST') {
      requirePasscode(req);
      const { fields } = req.body || {};
      if (!fields || !fields['First Name']) {
        res.status(400).json({ error: 'First Name is required.' });
        return;
      }
      const record = await createRecord(TABLE, fields);
      res.status(201).json({ record });
      return;
    }

    if (req.method === 'PATCH') {
      requirePasscode(req);
      const { id, fields } = req.body || {};
      if (!id || !fields) {
        res.status(400).json({ error: 'id and fields are required.' });
        return;
      }
      const record = await updateRecord(TABLE, id, fields);
      res.status(200).json({ record });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Unexpected error' });
  }
}
