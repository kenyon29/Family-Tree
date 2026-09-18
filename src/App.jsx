import { useCallback, useEffect, useMemo, useState } from 'react';
import { EditModeProvider } from './context/EditModeContext.jsx';
import { fetchPeople, fetchMarriages } from './api/client.js';
import { buildFamilyIndex } from './lib/familyData.js';
import Toolbar from './components/Toolbar.jsx';
import TreeView from './components/TreeView.jsx';
import PersonForm from './components/PersonForm.jsx';
import MarriageForm from './components/MarriageForm.jsx';
import ExportDialog from './components/ExportDialog.jsx';
import PasscodeDialog from './components/PasscodeDialog.jsx';

function AppInner() {
  const [people, setPeople] = useState(null);
  const [marriages, setMarriages] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [focusPersonId, setFocusPersonId] = useState(null);
  const [personForm, setPersonForm] = useState(null); // { mode, personId?, onSaved? }
  const [marriageForm, setMarriageForm] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([fetchPeople(), fetchMarriages()]);
      setPeople(p);
      setMarriages(m);
      setLoadError('');
    } catch (err) {
      setLoadError(err.message || 'Failed to load data.');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const index = useMemo(() => {
    if (!people || !marriages) return null;
    return buildFamilyIndex(people, marriages);
  }, [people, marriages]);

  const toggleCollapsed = useCallback((personId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }, []);

  if (loadError) {
    return (
      <div className="load-error">
        <h1>Couldn't load the family tree</h1>
        <p>{loadError}</p>
        <p>If you're the site administrator, check that AIRTABLE_API_KEY and AIRTABLE_BASE_ID are set correctly. See SETUP.md.</p>
        <button onClick={loadData}>Try again</button>
      </div>
    );
  }

  if (!index) {
    return <div className="loading-screen">Loading family tree…</div>;
  }

  return (
    <div className="app">
      <Toolbar
        index={index}
        onSearchSelect={(id) => setFocusPersonId(id)}
        onAddPerson={() => setPersonForm({ mode: 'add' })}
        onAddMarriage={() => setMarriageForm({ mode: 'add' })}
        onExport={() => setShowExport(true)}
        onRequestPasscode={() => setShowPasscode(true)}
        collapsedCount={collapsed.size}
        onExpandAll={() => setCollapsed(new Set())}
      />
      <TreeView
        index={index}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        focusPersonId={focusPersonId}
        onFocusHandled={() => setFocusPersonId(null)}
        onEditPerson={(personId) => setPersonForm({ mode: 'edit', personId })}
      />
      {personForm && (
        <PersonForm
          key={personForm.personId || 'new'}
          index={index}
          mode={personForm.mode}
          personId={personForm.personId}
          onClose={() => setPersonForm(null)}
          onSaved={async () => {
            await loadData();
            setPersonForm(null);
          }}
        />
      )}
      {marriageForm && (
        <MarriageForm
          index={index}
          onClose={() => setMarriageForm(null)}
          onSaved={async () => {
            await loadData();
            setMarriageForm(null);
          }}
        />
      )}
      {showExport && <ExportDialog index={index} onClose={() => setShowExport(false)} />}
      {showPasscode && <PasscodeDialog onClose={() => setShowPasscode(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <EditModeProvider>
      <AppInner />
    </EditModeProvider>
  );
}
