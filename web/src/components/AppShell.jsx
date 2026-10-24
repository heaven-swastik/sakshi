/**
 * AppShell.jsx — Executive Modern Tablet Chassis Layout.
 *
 * Implements a clean, refined design:
 * - Left vertical obsidian sidebar with soft icon navigation.
 * - Clean, spacious header with title, role perspective selector, and status indicator.
 * - Perfect padding and readable typography with complementary colors.
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UploadCloud, RadioTower, BarChart3,
  Award, UserCheck, ShieldCheck, Sparkles, Bell, Search,
  ChevronDown, RotateCcw, ShieldAlert, CheckCircle2, User,
  Activity, Lock, Clock, ExternalLink
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import HindiToggle from './HindiToggle';
import Seal from './Seal';
import { api } from '../api';

const NAV_ITEMS = [
  {
    to: '/overview',
    exact: true,
    icon: LayoutDashboard,
    label: 'Overview',
    step: 'Home',
    desc: 'National Admission Integrity & Verification Pulse'
  },
  {
    to: '/upload',
    icon: UploadCloud,
    label: 'Upload Admissions',
    step: '1',
    desc: 'CSV Ingestion & Instant Blind HMAC Sealing'
  },
  {
    to: '/radar',
    icon: RadioTower,
    label: 'Duplicate Radar',
    step: '2',
    desc: 'Cross-Institution Multi-Seat Detection (Rule R1)'
  },
  {
    to: '/integrity',
    icon: BarChart3,
    label: 'Seat Integrity & Quotas',
    step: '3',
    desc: 'Deterministic Scoring, Quota Ledgers & Season Replay'
  },
  {
    to: '/credential',
    icon: Award,
    label: 'Verifiable Certificate',
    step: '4',
    desc: 'Ed25519-Signed Degree QR & Tamper Verification'
  },
  {
    to: '/citizen',
    icon: UserCheck,
    label: 'Student Window',
    step: '5',
    desc: 'Student Citizen Consent & Ghost Seat Dispute'
  },
  {
    to: '/proof',
    icon: ShieldCheck,
    label: 'Privacy Proof',
    step: '6',
    desc: 'Zero Raw PII Storage Audit & SHA-256 Merkle Chain'
  },
];

export default function AppShell({ children }) {
  const { t } = useI18n();
  const { role, login, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [audit, setAudit] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;
    api.verifyAuditChain(token).then(setAudit).catch(() => setAudit(null));
  }, [token, location.pathname]);

  // Determine current active navigation item
  const currentNav = NAV_ITEMS.find(item =>
    item.exact ? location.pathname === '/overview' : location.pathname.startsWith(item.to)
  ) || NAV_ITEMS[0];

  const handleRoleSwitch = (newRole) => {
    login(`demo-${newRole}-token`, newRole);
    setRoleDropdownOpen(false);
  };

  if (location.pathname === '/' || location.pathname === '/story' || location.pathname.startsWith('/mg/')) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-2 sm:p-4 md:p-6 font-body text-gray-900 antialiased">
      {/* ── Outer Device Chassis ─────────────────────────────────── */}
      <div className="w-full max-w-[1380px] bg-[#181A20] rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-black/30 min-h-[820px]">
        
        {/* ── LEFT DARK ICON SIDEBAR ────────────────────────────────────────────── */}
        <aside className="w-full md:w-20 bg-[#181A20] flex md:flex-col items-center justify-between p-4 md:py-6 border-b md:border-b-0 md:border-r border-[#262A32] flex-shrink-0 z-20">
          {/* Top Logo Badge (Cream rounded square matching reference) */}
          <div className="flex md:flex-col items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-11 h-11 rounded-2xl bg-[#FFF9EA] text-[#181A20] flex items-center justify-center font-display font-black text-xl shadow-sm hover:scale-105 transition"
              title="SAKSHI — Enrolment Integrity Platform"
            >
              <span className="tracking-tighter">सा</span>
            </button>
          </div>

          {/* Navigation Icon List */}
          <nav className="flex md:flex-col items-center gap-2.5 my-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-gray-950 shadow-md font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={`${item.step === 'Home' ? 'Overview' : 'Step ' + item.step}: ${item.label}`}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />

                  {/* Desktop Hover Tooltip */}
                  <span className="hidden md:group-hover:block absolute left-14 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl z-50 pointer-events-none">
                    <span className="text-gray-400 block text-[10px] uppercase font-mono">
                      {item.step === 'Home' ? 'Overview' : `Step ${item.step}`}
                    </span>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Actions: Demo Mode Trigger */}
          <div className="flex md:flex-col items-center gap-2">
            <button
              onClick={() => navigate('/story')}
              className="w-10 h-10 rounded-xl bg-[#2A2E39] hover:bg-purple-600 text-purple-300 hover:text-white flex items-center justify-center transition shadow-sm group relative"
              title="Watch the 2-minute SAKSHI story"
            >
              <Sparkles size={17} className="animate-pulse" />
              <span className="hidden md:group-hover:block absolute left-14 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl z-50 pointer-events-none">
                Watch the 2-minute story
              </span>
            </button>
          </div>
        </aside>

        {/* ── MAIN WHITE CANVAS CONTAINER ───────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-[24px] m-2 md:m-2.5 p-5 sm:p-7 md:p-8 overflow-y-auto flex flex-col justify-between shadow-inner">
          <div>
            {/* ── TOP HEADER BAR (Clean, Airy, Compact) ────────────────────────────── */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 mb-6">
              {/* Left Title & Plain Subtitle */}
              <div>
                <div className="flex items-center gap-2 mb-1.5" data-tour="wordmark">
                  <Seal token="SAKSHI-WITNESS" size={20} />
                  <span className="font-display font-extrabold text-[13px] tracking-[0.2em] text-gray-950">SAKSHI</span>
                  <span className="text-[11px] text-gray-400 font-medium">· a witness that confirms, never discloses</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold font-display text-gray-950 tracking-tight">
                    {currentNav.label}
                  </h1>
                  {currentNav.step !== 'Home' && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Step {currentNav.step} of 6
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {currentNav.desc}
                </p>
              </div>

              {/* Right Controls: Gateway Status, Trust Badge, Hindi Toggle, Role Selector */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                {/* Synthetic Data Trust Badge */}
                <div className="hidden xl:flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F2B632]" />
                  <span>Synthetic Dataset (Seed 42) · Mock Registry Adapter</span>
                </div>

                {/* Live audit-chain pill (real: re-verified from the database on every page) */}
                <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-800" data-tour="audit-pill">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${audit && !audit.valid ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <span>{audit ? (audit.valid ? `Audit chain verified · ${audit.entries_checked} entries` : 'Audit chain BROKEN') : 'Checking audit chain…'}</span>
                </div>

                <HindiToggle />

                {/* Perspective Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full transition text-xs font-semibold text-gray-900 shadow-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {role === 'student' ? 'S' : role === 'institution' ? 'C' : 'A'}
                    </div>
                    <span className="hidden sm:inline">
                      {role === 'student' ? 'Student View' : role === 'institution' ? 'College Registrar' : 'AICTE Regulator'}
                    </span>
                    <ChevronDown size={13} className="text-gray-500" />
                  </button>

                  {roleDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5 z-50 text-xs">
                      <p className="px-3 py-1.5 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-100">
                        Switch Perspective:
                      </p>
                      <button
                        onClick={() => handleRoleSwitch('officer')}
                        className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                          role === 'officer' ? 'bg-gray-950 text-white font-bold' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>AICTE Central Regulator</span>
                        {role === 'officer' && <CheckCircle2 size={13} />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('institution')}
                        className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                          role === 'institution' ? 'bg-gray-950 text-white font-bold' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>College Registrar</span>
                        {role === 'institution' && <CheckCircle2 size={13} />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('student')}
                        className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                          role === 'student' ? 'bg-gray-950 text-white font-bold' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>Student Citizen Portal</span>
                        {role === 'student' && <CheckCircle2 size={13} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* ── SCREEN CONTENT ──────────────────────────────────────────────── */}
            <main>
              {children}
            </main>
          </div>

          {/* ── FOOTER BAR (Clean, Informative Telemetry) ────────────────────────── */}
          <footer className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
            <div className="flex items-center gap-3">
              <strong className="text-gray-900 font-semibold">SAKSHI</strong>
              <span>·</span>
              <span>AICTE Regulation Bureau (SIH 2026, PS SIH26263)</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Designed for the DPDP Act 2023 · no raw IDs stored
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono text-gray-400">
              <span>{audit ? `Audit log: ${audit.entries_checked} entries, ${audit.valid ? 'chain intact' : 'chain broken'}` : ''}</span>
              <span>·</span>
              <span className="text-gray-700 font-medium">{liveTime} IST</span>
            </div>
          </footer>
        </div>
      </div>

    </div>
  );
}

