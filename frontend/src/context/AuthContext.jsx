import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('rx_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [branchId, setBranchId] = useState(() => localStorage.getItem('rx_branch') || '');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branchId) localStorage.setItem('rx_branch', branchId);
  }, [branchId]);

  useEffect(() => {
    if (!user) return;
    api.get('/branches').then(({ data }) => setBranches(data)).catch(() => {});
  }, [user]);

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('rx_token', data.token);
      localStorage.setItem('rx_user', JSON.stringify(data.user));
      setUser(data.user);
      if (data.user.branch_id) setBranchId(String(data.user.branch_id));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'No se pudo iniciar sesión.' };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('rx_token');
    localStorage.removeItem('rx_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, branchId, setBranchId, branches }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
