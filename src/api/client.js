const PASSCODE_KEY = 'familyTree.editorPasscode';

export function getStoredPasscode() {
  try {
    return sessionStorage.getItem(PASSCODE_KEY) || '';
  } catch {
    return '';
  }
}

export function storePasscode(passcode) {
  try {
    sessionStorage.setItem(PASSCODE_KEY, passcode);
  } catch {
    // sessionStorage unavailable (e.g. private browsing) - edit mode just won't persist
  }
}

export function clearStoredPasscode() {
  try {
    sessionStorage.removeItem(PASSCODE_KEY);
  } catch {
    // ignore
  }
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function verifyPasscode(passcode) {
  const data = await request('/api/auth', {
    method: 'POST',
    body: JSON.stringify({ passcode }),
  });
  return data.ok === true;
}

export async function fetchPeople() {
  const data = await request('/api/people');
  return data.records;
}

export async function fetchMarriages() {
  const data = await request('/api/marriages');
  return data.records;
}

function authHeaders() {
  return { 'x-editor-passcode': getStoredPasscode() };
}

export async function createPerson(fields) {
  const data = await request('/api/people', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ fields }),
  });
  return data.record;
}

export async function updatePerson(id, fields) {
  const data = await request('/api/people', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ id, fields }),
  });
  return data.record;
}

export async function uploadPhoto(recordId, file) {
  const base64 = await fileToBase64(file);
  await request('/api/upload-photo', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ recordId, filename: file.name, contentType: file.type, base64 }),
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function createMarriage(fields) {
  const data = await request('/api/marriages', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ fields }),
  });
  return data.record;
}

export async function updateMarriage(id, fields) {
  const data = await request('/api/marriages', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ id, fields }),
  });
  return data.record;
}
