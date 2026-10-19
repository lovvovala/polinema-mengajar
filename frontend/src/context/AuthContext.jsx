import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'pm_token';
const USER_KEY = 'pm_peserta';

function bacaUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [peserta, setPeserta] = useState(bacaUser);

  const masuk = useCallback((tokenBaru, pesertaBaru) => {
    localStorage.setItem(TOKEN_KEY, tokenBaru);
    localStorage.setItem(USER_KEY, JSON.stringify(pesertaBaru));
    setToken(tokenBaru);
    setPeserta(pesertaBaru);
  }, []);

  const keluar = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setPeserta(null);
  }, []);

  const value = useMemo(() => ({ token, peserta, masuk, keluar }), [token, peserta, masuk, keluar]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
