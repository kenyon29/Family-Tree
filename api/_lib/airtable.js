const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

function getEnv() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error(
      'Server is missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID environment variables.'
    );
  }
  return { apiKey, baseId };
}

async function airtableFetch(path, options = {}) {
  const { apiKey, baseId } = getEnv();
  const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const message = body?.error?.message || body?.error || res.statusText;
    const err = new Error(`Airtable error (${res.status}): ${message}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

// Fetches every record in a table, following pagination automatically.
export async function listAllRecords(table) {
  const records = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (offset) params.set('offset', offset);
    const data = await airtableFetch(`/${encodeURIComponent(table)}?${params.toString()}`);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

export async function createRecord(table, fields) {
  const data = await airtableFetch(`/${encodeURIComponent(table)}`, {
    method: 'POST',
    body: JSON.stringify({ fields, typecast: true }),
  });
  return data;
}

export async function updateRecord(table, id, fields) {
  const data = await airtableFetch(`/${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields, typecast: true }),
  });
  return data;
}

export function requirePasscode(req) {
  const provided = req.headers['x-editor-passcode'];
  const expected = process.env.EDITOR_PASSCODE;
  if (!expected) {
    const err = new Error('Server is missing the EDITOR_PASSCODE environment variable.');
    err.status = 500;
    throw err;
  }
  if (!provided || provided !== expected) {
    const err = new Error('Incorrect or missing editor passcode.');
    err.status = 401;
    throw err;
  }
}
