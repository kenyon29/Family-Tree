import { useState } from 'react';
import { useEditMode } from '../context/EditModeContext.jsx';

export default function PasscodeDialog({ onClose }) {
  const { unlock, error } = useEditMode();
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    const ok = await unlock(passcode);
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Unlock Edit Mode</h2>
        <p>Enter the family passcode to add or edit people.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
          />
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !passcode}>
              {busy ? 'Checking…' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
