import { useMemo, useState } from 'react';
import { createMarriage } from '../api/client.js';
import PersonPicker from './PersonPicker.jsx';
import QuickAddPersonModal from './QuickAddPersonModal.jsx';

export default function MarriageForm({ index, onClose, onSaved }) {
  const [spouse1Id, setSpouse1Id] = useState(null);
  const [spouse2Id, setSpouse2Id] = useState(null);
  const [marriageDate, setMarriageDate] = useState('');
  const [divorceDate, setDivorceDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [extraPeople, setExtraPeople] = useState([]);
  const [quickAddTarget, setQuickAddTarget] = useState(null);

  const workingIndex = useMemo(() => {
    if (extraPeople.length === 0) return index;
    const people = [...index.people, ...extraPeople];
    const peopleById = new Map(index.peopleById);
    for (const p of extraPeople) peopleById.set(p.id, p);
    return { ...index, people, peopleById };
  }, [index, extraPeople]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!spouse1Id || !spouse2Id) {
      setError('Please choose both spouses.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const fields = {
        'Spouse 1': [spouse1Id],
        'Spouse 2': [spouse2Id],
        'Marriage Date': marriageDate || undefined,
        'Divorce Date': divorceDate || undefined,
      };
      await createMarriage(fields);
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save this marriage.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add a Marriage</h2>
        <form onSubmit={handleSubmit}>
          <PersonPicker
            index={workingIndex}
            label="Spouse 1"
            value={spouse1Id}
            excludeId={spouse2Id}
            onChange={setSpouse1Id}
            onQuickAdd={() => setQuickAddTarget('spouse1')}
          />
          <PersonPicker
            index={workingIndex}
            label="Spouse 2"
            value={spouse2Id}
            excludeId={spouse1Id}
            onChange={setSpouse2Id}
            onQuickAdd={() => setQuickAddTarget('spouse2')}
          />
          <div className="field-row">
            <div className="field">
              <label>Marriage date</label>
              <input type="date" value={marriageDate} onChange={(e) => setMarriageDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Divorce date</label>
              <input type="date" value={divorceDate} onChange={(e) => setDivorceDate(e.target.value)} />
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Add marriage'}
            </button>
          </div>
        </form>
      </div>

      {quickAddTarget && (
        <QuickAddPersonModal
          onClose={() => setQuickAddTarget(null)}
          onCreated={(record) => {
            const newPerson = {
              id: record.id,
              firstName: record.fields['First Name'] || '',
              lastName: record.fields['Last Name'] || '',
              birthDate: record.fields['Birth Date'] || null,
              deathDate: null,
              photoUrl: null,
              notes: '',
              fatherId: null,
              motherId: null,
              showNotesOnPrint: false,
              showPhotoOnPrint: true,
            };
            setExtraPeople((prev) => [...prev, newPerson]);
            if (quickAddTarget === 'spouse1') setSpouse1Id(record.id);
            if (quickAddTarget === 'spouse2') setSpouse2Id(record.id);
            setQuickAddTarget(null);
          }}
        />
      )}
    </div>
  );
}
