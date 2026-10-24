/**
 * AppShell.jsx — Executive Modern Tablet Chassis Layout with Dynamic Perspective Switching.
 *
 * Implements a clean, refined design:
 * - Left vertical obsidian sidebar with soft icon navigation.
 * - Clean, spacious header with title, dynamic role perspective selector, and status indicator.
 * - Active Role & Persona Banner: Dynamically highlights current viewpoint (Regulator vs College vs Student).
 * - Real JWT token synchronization so all screens and numbers update dynamically.
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
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-2 sm:p-4 md:p-6 font-body text-gray-900 antialiased">
      {/* ── Outer Device Chassis ─────────────────────────────────── */}
      <div className="w-full max-w-[1380px] bg-[#181A20] rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-black/30 min-h-[820px]">
        
        {/* ── LEFT DARK ICON SIDEBAR ────────────────────────────────────────────── */}
        <aside className="w-full md:w-20 bg-[#181A20] flex md:flex-col items-center justify-between p-4 md:py-6 border-b md:border-b-0 md:border-r border-[#262A32] flex-shrink-0 z-20">
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
          <nav className="flex md:flex-col items-center gap-2.5 my-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === '/overview'
                : location.pathname.startsWith(item.to);

              // Check if item is primary for the current role
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

                  {/* Role Primary Dot */}
                  {isRolePrimary && !isActive && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}

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
              title="Watch the 2-minute demo tour"
            >
              <Sparkles size={17} className="animate-pulse" />
              <span className="hidden md:group-hover:block absolute left-14 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl z-50 pointer-events-none">
                2-Minute Demo Tour
              </span>
            </button>
          </div>
        </aside>

        {/* ── MAIN WHITE CANVAS CONTAINER ───────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-[24px] m-2 md:m-2.5 p-5 sm:p-7 md:p-8 overflow-y-auto flex flex-col justify-between shadow-inner">
          <div>
            {/* ── TOP HEADER BAR ─────────────────────────────────────────────────── */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-3">
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

                {/* Live audit-chain pill */}
                <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-800" data-tour="audit-pill">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${audit && !audit.valid ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <span>{audit ? (audit.valid ? `Audit chain verified · ${audit.entries_checked} entries` : 'Audit chain BROKEN') : 'Checking audit chain…'}</span>
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

                      {/* Perspective 3: Student Citizen */}
                      <div className="mt-1 pt-1 border-t border-gray-100">
                        <p className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50/60 rounded-md mb-1">
                          Student Citizen View (Choose Story Persona):
                        </p>
                        <button
                          onClick={() => handleRoleSwitch('student', 'asha')}
                          className={`w-full text-left px-3 py-1.5 rounded-lg transition flex items-center justify-between ${
                            role === 'student' && persona === 'asha' ? 'bg-emerald-700 text-white font-bold' : 'hover:bg-emerald-50 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <GraduationCap size={13} />
                            <span>Asha Sharma (Opt-Out)</span>
                          </div>
                          {role === 'student' && persona === 'asha' && <CheckCircle2 size={12} />}
                        </button>
                        <button
                          onClick={() => handleRoleSwitch('student', 'ravi')}
                          className={`w-full text-left px-3 py-1.5 rounded-lg transition flex items-center justify-between ${
                            role === 'student' && persona === 'ravi' ? 'bg-emerald-700 text-white font-bold' : 'hover:bg-emerald-50 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <GraduationCap size={13} />
                            <span>Ravi Kumar (Dual Seat)</span>
                          </div>
                          {role === 'student' && persona === 'ravi' && <CheckCircle2 size={12} />}
                        </button>
                        <button
                          onClick={() => handleRoleSwitch('student', 'meera')}
                          className={`w-full text-left px-3 py-1.5 rounded-lg transition flex items-center justify-between ${
                            role === 'student' && persona === 'meera' ? 'bg-emerald-700 text-white font-bold' : 'hover:bg-emerald-50 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <GraduationCap size={13} />
                            <span>Meera Patel (Ghost Seat)</span>
                          </div>
                          {role === 'student' && persona === 'meera' && <CheckCircle2 size={12} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* ── DYNAMIC ACTIVE PERSPECTIVE BANNER ───────────────────────────────── */}
            <div className={`mb-5 p-3 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              role === 'student' 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : role === 'institution'
                ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  role === 'student' ? 'bg-emerald-600 text-white' : role === 'institution' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white'
                }`}>
                  {role === 'student' ? <GraduationCap size={16} /> : role === 'institution' ? <School size={16} /> : <Building2 size={16} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-display">
                      {role === 'student' 
                        ? `ACTIVE PERSPECTIVE: Student Citizen (${persona === 'ravi' ? 'Ravi Kumar' : persona === 'meera' ? 'Meera Patel' : 'Asha Sharma'})`
                        : role === 'institution'
                        ? 'ACTIVE PERSPECTIVE: College Registrar (MIT Pune · AICTE MH001)'
                        : 'ACTIVE PERSPECTIVE: AICTE Central Regulatory Bureau (New Delhi)'}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
                      role === 'student' ? 'bg-emerald-200 text-emerald-900' : role === 'institution' ? 'bg-blue-200 text-blue-900' : 'bg-gray-200 text-gray-800'
                    }`}>
                      Live JWT Synchronized
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {role === 'student'
                      ? (persona === 'asha' 
                          ? 'Enrolled in B.Tech CSE at MIT Pune · Opted out of APAAR (Supreme Court July 2026 Compliant) · Zero fraud penalty.'
                          : persona === 'ravi'
                          ? 'Holding simultaneous admissions at MIT Pune (MH001) & RV College Bengaluru (KA001) · Rule R1 Collision Flagged.'
                          : 'SSN College Chennai claimed an enrolment she never took · "This is not me" dispute ready to sign.')
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
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      persona === 'asha' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    Asha (Opt-Out)
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('student', 'ravi')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      persona === 'ravi' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    Ravi (Dual Seat)
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('student', 'meera')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
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
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition flex-shrink-0 flex items-center gap-1"
                >
                  <UploadCloud size={12} />
                  <span>Upload College CSV</span>
                </button>
              )}

              {role === 'officer' && (
                <button
                  onClick={() => navigate('/overview')}
                  className="px-3 py-1 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-2xs transition flex-shrink-0 flex items-center gap-1"
                >
                  <Activity size={12} />
                  <span>National Command</span>
                </button>
              )}
            </div>

            {/* ── SCREEN CONTENT ──────────────────────────────────────────────── */}
            <main>
              {children}
            </main>
          </div>

          {/* ── FOOTER BAR ──────────────────────────────────────────────────────── */}
          <footer className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
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
