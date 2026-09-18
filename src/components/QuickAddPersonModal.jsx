import { useState } from 'react';
import { createPerson } from '../api/client.js';

export default function QuickAddPersonModal({ onClose, onCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const fields = { 'First Name': firstName.trim() };
      if (lastName.trim()) fields['Last Name'] = lastName.trim();
      if (birthDate) fields['Birth Date'] = birthDate;
      const record = await createPerson(fields);
      onCreated(record);
    } catch (err) {
      setError(err.message || 'Could not add person.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Quick-add a person</h2>
        <p className="muted">You can fill in the rest of their details later.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>First name *</label>
            <input autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="field">
            <label>Last name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="field">
            <label>Birth date</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Adding…' : 'Add person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
