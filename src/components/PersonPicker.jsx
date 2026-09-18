import { useEffect, useMemo, useRef, useState } from 'react';
import { fullName, lifespan } from '../lib/familyData.js';

export default function PersonPicker({ index, label, value, onChange, excludeId, onQuickAdd, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selectedPerson = value ? index.peopleById.get(value) : null;

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = index.people.filter((p) => p.id !== excludeId);
    if (!q) return list.slice(0, 8);
    return list.filter((p) => fullName(p).toLowerCase().includes(q)).slice(0, 8);
  }, [query, index, excludeId]);

  if (selectedPerson) {
    return (
      <div className="field">
        {label && <label>{label}</label>}
        <div className="picker-selected">
          <span>
            {fullName(selectedPerson)} <span className="muted">{lifespan(selectedPerson)}</span>
          </span>
          <button type="button" className="btn-link" onClick={() => onChange(null)}>
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="field" ref={wrapRef}>
      {label && <label>{label}</label>}
      <div className="picker">
        <input
          type="text"
          value={query}
          placeholder={placeholder || 'Search by name…'}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
        {open && (
          <ul className="picker-results">
            {results.map((p) => (
              <li
                key={p.id}
                onClick={() => {
                  onChange(p.id);
                  setQuery('');
                  setOpen(false);
                }}
              >
                {fullName(p)} <span className="muted">{lifespan(p)}</span>
              </li>
            ))}
            {results.length === 0 && <li className="muted no-results">No matches</li>}
            {onQuickAdd && (
              <li
                className="picker-add"
                onClick={() => {
                  setOpen(false);
                  onQuickAdd();
                }}
              >
                + Add new person
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
