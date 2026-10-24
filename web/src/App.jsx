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
  persona: 'officer',
  userMeta: {},
  login: () => {},
  switchPerspective: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('sakshi_token') || null);
  const [role, setRole] = useState(() => sessionStorage.getItem('sakshi_role') || 'officer');
  const [persona, setPersona] = useState(() => sessionStorage.getItem('sakshi_persona') || 'officer');
  const [userMeta, setUserMeta] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('sakshi_usermeta') || '{}');
    } catch {
      return {};
    }
  });

  const switchPerspective = async (newRole, actorId = null, instId = null) => {
    const actor = actorId || (newRole === 'student' ? 'asha' : newRole === 'institution' ? 'mit-pune' : 'officer');
    const institutionId = instId || (newRole === 'institution' ? 1 : null);

    try {
      // Fetch genuine, signed JWT from backend with specific persona actor_id
      const res = await api.demoLogin(newRole, institutionId, actor);
      if (res?.access_token) {
        setToken(res.access_token);
        setRole(newRole);
        setPersona(actor);
        const meta = { actor, institutionId };
        setUserMeta(meta);
        sessionStorage.setItem('sakshi_token', res.access_token);
        sessionStorage.setItem('sakshi_role', newRole);
        sessionStorage.setItem('sakshi_persona', actor);
        sessionStorage.setItem('sakshi_usermeta', JSON.stringify(meta));
        return res.access_token;
      }
    } catch (err) {
      console.warn('Demo login failed, using fallback session:', err);
    }

    // Local fallback if server unreachable
    const fallback = `demo-${newRole}-${actor}-session`;
    setToken(fallback);
    setRole(newRole);
    setPersona(actor);
    sessionStorage.setItem('sakshi_token', fallback);
    sessionStorage.setItem('sakshi_role', newRole);
    sessionStorage.setItem('sakshi_persona', actor);
    return fallback;
  };

  // Ensure there is always a valid demo session on initial arrival
  useEffect(() => {
    if (!token) {
      switchPerspective('officer');
    }
  }, []);

  const login = (newToken, newRole = 'officer', newPersona = 'officer', newMeta = {}) => {
    setToken(newToken);
    setRole(newRole);
    setPersona(newPersona);
    setUserMeta(newMeta);
    sessionStorage.setItem('sakshi_token', newToken);
    sessionStorage.setItem('sakshi_role', newRole);
    sessionStorage.setItem('sakshi_persona', newPersona);
    sessionStorage.setItem('sakshi_usermeta', JSON.stringify(newMeta));
  };

  const logout = () => {
    setToken(null);
    setRole('officer');
    setPersona('officer');
    setUserMeta({});
    sessionStorage.removeItem('sakshi_token');
    sessionStorage.removeItem('sakshi_role');
    sessionStorage.removeItem('sakshi_persona');
    sessionStorage.removeItem('sakshi_usermeta');
  };

  return (
    <AuthContext.Provider value={{ token, role, persona, userMeta, login, switchPerspective, logout }}>
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
              <Route path="/briefing" element={<StoryPlayer />} />
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

