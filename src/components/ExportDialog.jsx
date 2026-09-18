import { useState } from 'react';
import PersonPicker from './PersonPicker.jsx';
import { buildSubtreeIndex } from '../lib/familyData.js';
import { exportFullTreePdf, exportBranchPdf } from '../lib/pdfExport.js';

export default function ExportDialog({ index, onClose }) {
  const [mode, setMode] = useState('full'); // 'full' | 'branch'
  const [branchPersonId, setBranchPersonId] = useState(null);
  const [includeExtras, setIncludeExtras] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setError('');
    if (mode === 'branch' && !branchPersonId) {
      setError('Choose a person to start the branch export from.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'full') {
        await exportFullTreePdf(index, { includeExtras });
      } else {
        const subIndex = buildSubtreeIndex(index, branchPersonId);
        await exportBranchPdf(subIndex, branchPersonId, { includeExtras });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Print / Export</h2>

        <div className="export-mode-choice">
          <label>
            <input type="radio" checked={mode === 'full'} onChange={() => setMode('full')} />
            Export Full Tree (one large poster PDF)
          </label>
          <label>
            <input type="radio" checked={mode === 'branch'} onChange={() => setMode('branch')} />
            Export Branch (a person and their descendants, on Letter pages)
          </label>
        </div>

        {mode === 'branch' && (
          <PersonPicker
            index={index}
            label="Starting person"
            value={branchPersonId}
            onChange={setBranchPersonId}
          />
        )}

        <label className="checkbox-field">
          <input type="checkbox" checked={includeExtras} onChange={(e) => setIncludeExtras(e.target.checked)} />
          Include notes and photos in export (only for people with those print options checked)
        </label>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleExport} disabled={busy}>
            {busy ? 'Preparing PDF…' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
