/**
 * App.jsx — Root Application with Authentication, i18n, and Router setup.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { api } from './api';

// Components
import AppShell from './components/AppShell';

// Screens
import Home from './screens/Home';
import Welcome from './screens/Welcome';
import StoryPlayer from './story/StoryPlayer';
import MotionCards from './screens/MotionCards';
import Upload from './screens/Upload';
import Radar from './screens/Radar';
import Integrity from './screens/Integrity';
import Credential from './screens/Credential';
import CitizenWindow from './screens/CitizenWindow';
import PrivacyProof from './screens/PrivacyProof';
import PublicVerify from './screens/PublicVerify';

// ─── Authentication Context ──────────────────────────────────────────────────

export const AuthContext = createContext({
  token: null,
  role: 'officer',
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('sakshi_token') || null);
  const [role, setRole] = useState(() => sessionStorage.getItem('sakshi_role') || 'officer');

  // Ensure there is always a valid demo session on first arrival
  useEffect(() => {
    if (!token) {
      api.demoLogin('officer')
        .then((res) => {
          if (res?.access_token) {
            setToken(res.access_token);
            setRole('officer');
            sessionStorage.setItem('sakshi_token', res.access_token);
            sessionStorage.setItem('sakshi_role', 'officer');
          }
        })
        .catch(() => {
          // Fallback demo token for offline or initial load
          const fallback = 'demo-officer-session';
          setToken(fallback);
          setRole('officer');
          sessionStorage.setItem('sakshi_token', fallback);
          sessionStorage.setItem('sakshi_role', 'officer');
        });
    }
  }, [token]);

  const login = (newToken, newRole = 'officer') => {
    setToken(newToken);
    setRole(newRole);
    sessionStorage.setItem('sakshi_token', newToken);
    sessionStorage.setItem('sakshi_role', newRole);
  };

  const logout = () => {
    setToken(null);
    setRole('officer');
    sessionStorage.removeItem('sakshi_token');
    sessionStorage.removeItem('sakshi_role');
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Root App Component ──────────────────────────────────────────────────────

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/story" element={<StoryPlayer />} />
              <Route path="/mg/:kind" element={<MotionCards />} />
              <Route path="/overview" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/radar" element={<Radar />} />
              <Route path="/integrity" element={<Integrity />} />
              <Route path="/credential" element={<Credential />} />
              <Route path="/credential/verify/:handle" element={<Credential />} />
              <Route path="/verify" element={<PublicVerify />} />
              <Route path="/verify/:handle" element={<PublicVerify />} />
              <Route path="/citizen" element={<CitizenWindow />} />
              <Route path="/proof" element={<PrivacyProof />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

