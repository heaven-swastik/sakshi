/**
 * AppShell.jsx — Executive Modern Tablet Chassis Layout with Fixed Frame & Pinned Navbar.
 *
 * Implements a true fixed-frame hardware chassis:
 * - Outer dark bezel/frame stays stationary like a physical tablet.
 * - Left icon sidebar remains constant and fixed.
 * - Top navbar, title, and perspective switcher are pinned and never scroll out of view.
 * - Middle viewport (<main>) is the only element that scrolls smoothly.
 * - Bottom status footer is pinned and constant.
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UploadCloud, RadioTower, BarChart3,
  Award, UserCheck, ShieldCheck, Sparkles, Bell, Search,
  ChevronDown, RotateCcw, ShieldAlert, CheckCircle2, User,
  Activity, Lock, Clock, ExternalLink, School, GraduationCap, Building2, UserCircle
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
    desc: 'National Admission Integrity & Verification Pulse',
    roles: ['officer', 'institution', 'student'],
  },
  {
    to: '/upload',
    icon: UploadCloud,
    label: 'Upload Admissions',
    step: '1',
    desc: 'CSV Ingestion & Instant Blind HMAC Sealing',
    roles: ['institution', 'officer'],
  },
  {
    to: '/radar',
    icon: RadioTower,
    label: 'Duplicate Radar',
    step: '2',
    desc: 'Cross-Institution Multi-Seat Detection (Rule R1)',
    roles: ['officer', 'institution'],
  },
  {
    to: '/integrity',
    icon: BarChart3,
    label: 'Seat Integrity & Quotas',
    step: '3',
    desc: 'Deterministic Scoring, Quota Ledgers & Season Replay',
    roles: ['officer', 'institution'],
  },
  {
    to: '/credential',
    icon: Award,
    label: 'Verifiable Certificate',
    step: '4',
    desc: 'Ed25519-Signed Degree QR & Tamper Verification',
    roles: ['student', 'institution', 'officer'],
  },
  {
    to: '/citizen',
    icon: UserCheck,
    label: 'Student Window',
    step: '5',
    desc: 'Student Citizen Consent & Ghost Seat Dispute',
    roles: ['student', 'officer'],
  },
  {
    to: '/proof',
    icon: ShieldCheck,
    label: 'Privacy Proof',
    step: '6',
    desc: 'Zero Raw PII Storage Audit & SHA-256 Merkle Chain',
    roles: ['officer', 'institution', 'student'],
  },
];

export default function AppShell({ children }) {
  const { t } = useI18n();
  const { role, persona, switchPerspective, token } = useAuth();
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

  const handleRoleSwitch = async (newRole, actorId = null, instId = null) => {
    setRoleDropdownOpen(false);
    await switchPerspective(newRole, actorId, instId);

    // Automatically navigate to the most relevant view for that persona
    if (newRole === 'student') {
      navigate('/citizen');
    } else if (newRole === 'institution') {
      navigate('/upload');
    } else {
      navigate('/overview');
    }
  };

  if (location.pathname === '/' || location.pathname === '/story' || location.pathname === '/briefing' || location.pathname.startsWith('/mg/')) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen w-screen bg-[#F1F5F9] flex items-center justify-center p-1.5 sm:p-2.5 md:p-3.5 font-body text-gray-900 antialiased overflow-hidden select-none">
      {/* ── Outer Device Chassis (Constant Stationary Frame) ───────────────────────── */}
      <div className="w-full max-w-[1440px] h-full max-h-[98vh] bg-[#181A20] rounded-[24px] sm:rounded-[30px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-black/40">
        
        {/* ── LEFT DARK ICON SIDEBAR (Constant Fixed Sidebar) ───────────────────── */}
        <aside className="w-full md:w-20 bg-[#181A20] flex md:flex-col items-center justify-between p-3 md:py-5 border-b md:border-b-0 md:border-r border-[#262A32] flex-shrink-0 z-20">
          {/* Top Logo Badge */}
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
          <nav className="flex md:flex-col items-center gap-2 my-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === '/overview'
                : location.pathname.startsWith(item.to);

              const isRolePrimary = 
                (role === 'student' && item.to === '/citizen') ||
                (role === 'institution' && item.to === '/upload') ||
                (role === 'officer' && item.to === '/overview');

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-gray-950 shadow-md font-bold'
                      : isRolePrimary
                      ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={`${item.step === 'Home' ? 'Overview' : 'Step ' + item.step}: ${item.label}`}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />

                  {/* Primary role indicator dot */}
                  {isRolePrimary && !isActive && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}

                  {/* Desktop Tooltip */}
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
              title="Watch the 2-minute demo tour"
            >
              <Sparkles size={17} className="animate-pulse" />
              <span className="hidden md:group-hover:block absolute left-14 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl z-50 pointer-events-none">
                2-Minute Demo Tour
              </span>
            </button>
          </div>
        </aside>

        {/* ── MAIN WHITE CANVAS (Fixed Viewport, Scrollable Body Only) ─────────────── */}
        <div className="flex-1 h-full bg-white rounded-[20px] sm:rounded-[24px] m-1.5 md:m-2 flex flex-col overflow-hidden shadow-inner">
          
          {/* ── PINNED TOP ZONE (Header + Perspective Switcher — NEVER SCROLLS) ─────── */}
          <div className="flex-shrink-0 bg-white px-5 sm:px-7 pt-4 sm:pt-5 pb-3 border-b border-gray-100 z-10">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              {/* Left Title & Plain Subtitle */}
              <div>
                <div className="flex items-center gap-2 mb-1" data-tour="wordmark">
                  <Seal token="SAKSHI-WITNESS" size={18} />
                  <span className="font-display font-extrabold text-[12px] tracking-[0.2em] text-gray-950">SAKSHI</span>
                  <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">· a witness that confirms, never discloses</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold font-display text-gray-950 tracking-tight leading-tight">
                    {currentNav.label}
                  </h1>
                  {currentNav.step !== 'Home' && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Step {currentNav.step} of 6
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium truncate max-w-xl">
                  {currentNav.desc}
                </p>
              </div>

              {/* Right Controls: Gateway Status, Hindi Toggle, Role Selector */}
              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                {/* Synthetic Data Trust Badge */}
                <div className="hidden xl:flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F2B632]" />
                  <span>Synthetic Dataset (Seed 42)</span>
                </div>

                {/* Live audit-chain pill */}
                <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-800" data-tour="audit-pill">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${audit && !audit.valid ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <span>{audit ? (audit.valid ? `Audit: ${audit.entries_checked} entries` : 'Chain Broken') : 'Checking…'}</span>
                </div>

                <HindiToggle />

                {/* Perspective Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition text-xs font-semibold shadow-xs border ${
                      role === 'student'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                        : role === 'institution'
                        ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
                        : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                      role === 'student' ? 'bg-emerald-600' : role === 'institution' ? 'bg-blue-600' : 'bg-gray-900'
                    }`}>
                      {role === 'student' ? 'S' : role === 'institution' ? 'C' : 'A'}
                    </div>
                    <span className="hidden sm:inline">
                      {role === 'student' 
                        ? (persona === 'ravi' ? 'Ravi (Student)' : persona === 'meera' ? 'Meera (Student)' : 'Asha (Student)')
                        : role === 'institution' 
                        ? 'College Registrar' 
                        : 'AICTE Regulator'}
                    </span>
                    <ChevronDown size={13} className="text-gray-500" />
                  </button>

                  {roleDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1.5">
                        Switch Perspective & Persona:
                      </p>
                      
                      {/* Perspective 1: AICTE Regulator */}
                      <button
                        onClick={() => handleRoleSwitch('officer')}
                        className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between mt-1 ${
                          role === 'officer' ? 'bg-gray-950 text-white font-bold' : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className={role === 'officer' ? 'text-white' : 'text-gray-500'} />
                          <div>
                            <p className="font-semibold text-xs leading-tight">AICTE Central Regulator</p>
                            <p className={`text-[10px] ${role === 'officer' ? 'text-gray-300' : 'text-gray-500'}`}>National overview & radar</p>
                          </div>
                        </div>
                        {role === 'officer' && <CheckCircle2 size={13} className="text-emerald-400" />}
                      </button>

                      {/* Perspective 2: College Registrar */}
                      <button
                        onClick={() => handleRoleSwitch('institution', 'mit-pune', 1)}
                        className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between mt-1 ${
                          role === 'institution' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <School size={14} className={role === 'institution' ? 'text-white' : 'text-blue-500'} />
                          <div>
                            <p className="font-semibold text-xs leading-tight">College Registrar</p>
                            <p className={`text-[10px] ${role === 'institution' ? 'text-blue-100' : 'text-gray-500'}`}>MIT Pune (MH001 · CSV upload)</p>
                          </div>
                        </div>
                        {role === 'institution' && <CheckCircle2 size={13} />}
                      </button>

                      {/* Perspective 3: Student Citizen Portal */}
                      <div className="mt-1 pt-1 border-t border-gray-100">
                        <button
                          onClick={() => handleRoleSwitch('student', persona || 'asha')}
                          className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between mt-1 ${
                            role === 'student' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-emerald-50 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap size={14} className={role === 'student' ? 'text-white' : 'text-emerald-600'} />
                            <div>
                              <p className="font-semibold text-xs leading-tight">Student Citizen Portal</p>
                              <p className={`text-[10px] ${role === 'student' ? 'text-emerald-100' : 'text-gray-500'}`}>Citizen rights, disputes & consent</p>
                            </div>
                          </div>
                          {role === 'student' && <CheckCircle2 size={13} />}
                        </button>

                        {/* Persona Quick Switches */}
                        <div className="mt-1.5 p-1.5 bg-gray-50 rounded-xl space-y-1">
                          <p className="px-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            Story Personas:
                          </p>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              onClick={() => handleRoleSwitch('student', 'asha')}
                              className={`py-1 px-1.5 rounded-lg text-center text-[10px] font-bold transition truncate ${
                                role === 'student' && persona === 'asha' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-white hover:bg-emerald-50 text-gray-700 border border-gray-200/60'
                              }`}
                              title="Asha Sharma: Lawfully opted out of APAAR (MIT Pune)"
                            >
                              Asha (Opt)
                            </button>
                            <button
                              onClick={() => handleRoleSwitch('student', 'ravi')}
                              className={`py-1 px-1.5 rounded-lg text-center text-[10px] font-bold transition truncate ${
                                role === 'student' && persona === 'ravi' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-white hover:bg-emerald-50 text-gray-700 border border-gray-200/60'
                              }`}
                              title="Ravi Kumar: Dual seat collision at MIT Pune & RV College"
                            >
                              Ravi (Dual)
                            </button>
                            <button
                              onClick={() => handleRoleSwitch('student', 'meera')}
                              className={`py-1 px-1.5 rounded-lg text-center text-[10px] font-bold transition truncate ${
                                role === 'student' && persona === 'meera' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-white hover:bg-emerald-50 text-gray-700 border border-gray-200/60'
                              }`}
                              title="Meera Patel: Ghost seat claim dispute (SSN College)"
                            >
                              Meera (Ghost)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Dynamic Active Perspective Indicator Banner */}
            <div className={`p-2.5 rounded-xl border transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
              role === 'student' 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : role === 'institution'
                ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  role === 'student' ? 'bg-emerald-600 text-white' : role === 'institution' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white'
                }`}>
                  {role === 'student' ? <GraduationCap size={14} /> : role === 'institution' ? <School size={14} /> : <Building2 size={14} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-display">
                      {role === 'student' 
                        ? `ACTIVE: Student Citizen (${persona === 'ravi' ? 'Ravi Kumar' : persona === 'meera' ? 'Meera Patel' : 'Asha Sharma'})`
                        : role === 'institution'
                        ? 'ACTIVE: College Registrar (MIT Pune · AICTE MH001)'
                        : 'ACTIVE: AICTE Central Regulation Bureau (New Delhi)'}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      role === 'student' ? 'bg-emerald-200 text-emerald-900' : role === 'institution' ? 'bg-blue-200 text-blue-900' : 'bg-gray-200 text-gray-800'
                    }`}>
                      Live JWT
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 truncate max-w-xl">
                    {role === 'student'
                      ? (persona === 'asha' 
                          ? 'MIT Pune B.Tech CSE · Lawfully opted out of APAAR (Supreme Court July 2026 Compliant) · 0 fraud penalty.'
                          : persona === 'ravi'
                          ? 'Simultaneous admissions at MIT Pune (MH001) & RV College (KA001) · Rule R1 Collision Flagged.'
                          : 'SSN College claimed an enrolment she never took · "This is not me" dispute ready to sign.')
                      : role === 'institution'
                      ? 'Approved Intake: 240 seats · Reported Admissions: 312 · Upload batch CSVs, preview blind sealing, and download EoA reports.'
                      : 'National Scope: 15 institutions · 3,333 student seats · Real-time duplicate collision radar and explainable rules R1–R6.'}
                  </p>
                </div>
              </div>

              {/* Quick Persona Toggles in Banner */}
              {role === 'student' && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                  <span className="text-[10px] font-semibold text-emerald-800">Persona:</span>
                  <button
                    onClick={() => handleRoleSwitch('student', 'asha')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      persona === 'asha' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    Asha (Opt-Out)
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('student', 'ravi')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      persona === 'ravi' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    Ravi (Dual Seat)
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('student', 'meera')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      persona === 'meera' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    Meera (Dispute)
                  </button>
                </div>
              )}

              {role === 'institution' && (
                <button
                  onClick={() => navigate('/upload')}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold shadow-2xs transition flex-shrink-0 flex items-center gap-1"
                >
                  <UploadCloud size={12} />
                  <span>Upload College CSV</span>
                </button>
              )}

              {role === 'officer' && (
                <button
                  onClick={() => navigate('/overview')}
                  className="px-2.5 py-1 rounded bg-gray-900 hover:bg-black text-white text-[11px] font-semibold shadow-2xs transition flex-shrink-0 flex items-center gap-1"
                >
                  <Activity size={12} />
                  <span>National Command</span>
                </button>
              )}
            </div>
          </div>

          {/* ── SCROLLABLE MIDDLE VIEWPORT (ONLY THIS AREA SCROLLS) ───────────────── */}
          <main className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 scroll-smooth">
            {children}
          </main>

          {/* ── PINNED BOTTOM FOOTER BAR (NEVER SCROLLS) ─────────────────────────── */}
          <footer className="flex-shrink-0 bg-white px-5 sm:px-7 py-2.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2 z-10">
            <div className="flex items-center gap-3">
              <strong className="text-gray-900 font-semibold">SAKSHI</strong>
              <span>·</span>
              <span>AICTE Regulation Bureau (SIH 2026, PS SIH26263)</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Designed for the DPDP Act 2023 · zero raw PII stored
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
