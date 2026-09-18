import { useMemo, useState } from 'react';
import { fullName, lifespan } from '../lib/familyData.js';
import { useEditMode } from '../context/EditModeContext.jsx';

export default function Toolbar({
  index,
  onSearchSelect,
  onAddPerson,
  onAddMarriage,
  onExport,
  onRequestPasscode,
  onExpandAll,
  collapsedCount,
}) {
  const { isEditMode, lock } = useEditMode();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.people
      .filter((p) => fullName(p).toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, index]);

  return (
    <header className="toolbar">
      <div className="toolbar-brand">Family Tree</div>

      <div className="toolbar-search">
        <input
          type="search"
          placeholder="Search for a person…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <ul className="search-results">
            {results.map((p) => (
              <li
                key={p.id}
                onClick={() => {
                  onSearchSelect(p.id);
                  setQuery('');
                }}
              >
                <span>{fullName(p)}</span>
                <span className="muted">{lifespan(p)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="toolbar-actions">
        {collapsedCount > 0 && (
          <button className="btn-secondary" onClick={onExpandAll}>
            Expand all
          </button>
        )}
        <button className="btn-secondary" onClick={onExport}>
          Print / Export
        </button>
        {isEditMode ? (
          <>
            <button className="btn-primary" onClick={onAddPerson}>
              + Add Person
            </button>
            <button className="btn-secondary" onClick={onAddMarriage}>
              + Add Marriage
            </button>
            <button className="btn-link" onClick={lock}>
              Lock Edit Mode
            </button>
          </>
        ) : (
          <button className="btn-secondary" onClick={onRequestPasscode}>
            Unlock Edit Mode
          </button>
        )}
      </div>
    </header>
  );
}
