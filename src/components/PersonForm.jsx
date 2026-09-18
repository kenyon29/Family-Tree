import { useMemo, useState } from 'react';
import { createPerson, updatePerson, uploadPhoto } from '../api/client.js';
import { fullName } from '../lib/familyData.js';
import PersonPicker from './PersonPicker.jsx';
import QuickAddPersonModal from './QuickAddPersonModal.jsx';

export default function PersonForm({ index, mode, personId, onClose, onSaved }) {
  const existing = personId ? index.peopleById.get(personId) : null;

  const [firstName, setFirstName] = useState(existing?.firstName || '');
  const [lastName, setLastName] = useState(existing?.lastName || '');
  const [birthDate, setBirthDate] = useState(existing?.birthDate || '');
  const [deathDate, setDeathDate] = useState(existing?.deathDate || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [fatherId, setFatherId] = useState(existing?.fatherId || null);
  const [motherId, setMotherId] = useState(existing?.motherId || null);
  const [showNotesOnPrint, setShowNotesOnPrint] = useState(existing?.showNotesOnPrint || false);
  const [showPhotoOnPrint, setShowPhotoOnPrint] = useState(
    existing ? existing.showPhotoOnPrint : true
  );
  const [photoFile, setPhotoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // People quick-added from within this form (so pickers can select them
  // immediately, before the outer list has been refetched from Airtable).
  const [extraPeople, setExtraPeople] = useState([]);
  const [quickAddTarget, setQuickAddTarget] = useState(null); // 'father' | 'mother' | null

  const workingIndex = useMemo(() => {
    if (extraPeople.length === 0) return index;
    const people = [...index.people, ...extraPeople];
    const peopleById = new Map(index.peopleById);
    for (const p of extraPeople) peopleById.set(p.id, p);
    return { ...index, people, peopleById };
  }, [index, extraPeople]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const fields = {
        'First Name': firstName.trim(),
        'Last Name': lastName.trim() || undefined,
        'Birth Date': birthDate || undefined,
        'Death Date': deathDate || undefined,
        'Notes/Bio': notes || undefined,
        Father: fatherId ? [fatherId] : [],
        Mother: motherId ? [motherId] : [],
        'Show Notes On Print': showNotesOnPrint,
        'Show Photo On Print': showPhotoOnPrint,
      };

      let record;
      if (mode === 'edit') {
        record = await updatePerson(personId, fields);
      } else {
        record = await createPerson(fields);
      }

      if (photoFile) {
        try {
          await uploadPhoto(record.id, photoFile);
        } catch (photoErr) {
          console.error('Photo upload failed:', photoErr);
        }
      }

      onSaved(record.id);
    } catch (err) {
      setError(err.message || 'Could not save this person.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === 'edit' ? `Edit ${fullName(existing)}` : 'Add a Person'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>First name *</label>
              <input autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="field">
              <label>Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Birth date</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Death date</label>
              <input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <PersonPicker
              index={workingIndex}
              label="Father"
              value={fatherId}
              excludeId={personId}
              onChange={setFatherId}
              onQuickAdd={() => setQuickAddTarget('father')}
            />
            <PersonPicker
              index={workingIndex}
              label="Mother"
              value={motherId}
              excludeId={personId}
              onChange={setMotherId}
              onQuickAdd={() => setQuickAddTarget('mother')}
            />
          </div>

          <div className="field">
            <label>Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
          </div>

          <div className="field">
            <label>Notes / bio</label>
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="field-row checkboxes">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={showPhotoOnPrint}
                onChange={(e) => setShowPhotoOnPrint(e.target.checked)}
              />
              Show photo on printed exports
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={showNotesOnPrint}
                onChange={(e) => setShowNotesOnPrint(e.target.checked)}
              />
              Show notes on printed exports
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add person'}
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
            if (quickAddTarget === 'father') setFatherId(record.id);
            if (quickAddTarget === 'mother') setMotherId(record.id);
            setQuickAddTarget(null);
          }}
        />
      )}
    </div>
  );
}
