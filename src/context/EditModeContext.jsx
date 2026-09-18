import { createContext, useCallback, useContext, useState } from 'react';
import { getStoredPasscode, storePasscode, clearStoredPasscode, verifyPasscode } from '../api/client.js';

const EditModeContext = createContext(null);

export function EditModeProvider({ children }) {
  const [isEditMode, setIsEditMode] = useState(() => !!getStoredPasscode());
  const [error, setError] = useState('');

  const unlock = useCallback(async (passcode) => {
    setError('');
    const ok = await verifyPasscode(passcode);
    if (ok) {
      storePasscode(passcode);
      setIsEditMode(true);
      return true;
    }
    setError('That passcode is not correct.');
    return false;
  }, []);

  const lock = useCallback(() => {
    clearStoredPasscode();
    setIsEditMode(false);
  }, []);

  return (
    <EditModeContext.Provider value={{ isEditMode, unlock, lock, error }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) throw new Error('useEditMode must be used within EditModeProvider');
  return ctx;
}
