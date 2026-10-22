/**
 * AppShell.jsx — Modern Tablet/Desktop Chassis Layout.
 *
 * Modeled directly on the executive tablet frame:
 * - Left vertical dark sidebar with sleek icon navigation.
 * - Top header with Page Title, 1-Line Explanation, Step-by-Step Pipeline, and Role Switcher.
 * - High-contrast white canvas inside rounded frame with soft outer backdrop.
 */

import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UploadCloud, RadioTower, BarChart3,
  Award, UserCheck, ShieldCheck, Sparkles, Bell, Search,
  ChevronDown, RotateCcw, ShieldAlert, CheckCircle2, User
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import HindiToggle from './HindiToggle';
import DemoMode from './DemoMode';

const NAV_ITEMS = [
  {
    to: '/',
    exact: true,
    icon: LayoutDashboard,
    label: 'Overview',
    step: 'Home',
    desc: 'National Admission Health'
  },
  {
    to: '/upload',
    icon: UploadCloud,
    label: '1. Upload Admissions',
    step: 'Step 1',
    desc: 'Upload CSV & Seal IDs'
  },
  {
    to: '/radar',
    icon: RadioTower,
    label: '2. Duplicate Radar',
    step: 'Step 2',
    desc: 'Cross-College Duplicates'
  },
  {
    to: '/integrity',
    icon: BarChart3,
    label: '3. Seat Integrity & Quota',
    step: 'Step 3',
    desc: 'Intake Rules, NRI/OCI, Replay'
  },
  {
    to: '/credential',
    icon: Award,
    label: '4. Verifiable Certificate',
    step: 'Step 4',
    desc: 'Degree QR & Verify Block'
  },
  {
    to: '/citizen',
    icon: UserCheck,
    label: '5. Student Window',
    step: 'Step 5',
    desc: 'Student OTP & Ghost Disputes'
  },
  {
    to: '/proof',
    icon: ShieldCheck,
    label: '6. Privacy Proof',
    step: 'Step 6',
    desc: 'Zero Raw IDs Verification'
  },
];

export default function AppShell({ children }) {
  const { t } = useI18n();
  const { role, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Determine current active navigation item
  const currentNav = NAV_ITEMS.find(item =>
    item.exact ? location.pathname === '/' : location.pathname.startsWith(item.to)
  ) || NAV_ITEMS[0];

  const handleRoleSwitch = (newRole) => {
    login(`demo-${newRole}-token`, newRole);
    setRoleDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#EAF0F6] flex items-center justify-center p-2 sm:p-4 md:p-6 font-body text-ink antialiased">
      {/* ── Outer Device / Tablet Frame Chassis ─────────────────────────────────── */}
      <div className="w-full max-w-[1440px] bg-[#0E1116] rounded-[36px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-black/30 min-h-[860px]">
        
        {/* ── LEFT DARK ICON SIDEBAR ────────────────────────────────────────────── */}
        <aside className="w-full md:w-20 bg-[#0E1116] flex md:flex-col items-center justify-between p-4 md:py-7 border-b md:border-b-0 md:border-r border-[#1B202A] flex-shrink-0 z-20">
          {/* Top Logo Badge */}
          <div className="flex md:flex-col items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-12 h-12 rounded-2xl bg-[#F9F7E8] text-[#0E1116] flex items-center justify-center font-display font-black text-xl shadow-md hover:scale-105 transition"
              title="SAKSHI — Enrolment Integrity Witness"
            >
              <span className="tracking-tighter">सा</span>
            </button>
          </div>

          {/* Navigation Icon List */}
          <nav className="flex md:flex-col items-center gap-2 my-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative group w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-ink shadow-md font-bold'
                      : 'text-slate/60 hover:text-white hover:bg-white/10'
                  }`}
                  title={`${item.step}: ${item.label}`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />

                  {/* Desktop Hover Tooltip */}
                  <span className="hidden md:group-hover:block absolute left-16 bg-ink text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl z-50 pointer-events-none">
                    <span className="text-white/60 block text-[10px] uppercase font-mono">{item.step}</span>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Actions: Demo Mode Trigger */}
          <div className="flex md:flex-col items-center gap-2">
            <button
              onClick={() => setShowDemoModal(true)}
              className="w-11 h-11 rounded-2xl bg-crimson text-white flex items-center justify-center shadow-lg hover:bg-crimson/90 transition group relative"
              title="Start 2-Minute Judge Guided Tour"
            >
              <Sparkles size={18} className="animate-pulse" />
              <span className="hidden md:group-hover:block absolute left-16 bg-crimson text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl z-50 pointer-events-none">
                Start Judge Guided Tour
              </span>
            </button>
          </div>
        </aside>

        {/* ── MAIN WHITE CANVAS CONTAINER ───────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-[28px] m-2 md:m-3 p-5 sm:p-7 md:p-9 overflow-y-auto flex flex-col justify-between shadow-inner min-h-[780px]">
          <div>
            {/* ── TOP HEADER BAR ─────────────────────────────────────────────────── */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-fog mb-6">
              {/* Left Title & Plain Explanation */}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink tracking-tight">
                    {currentNav.label.replace(/^\d+\.\s*/, '')}
                  </h1>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-paper border border-fog text-slate">
                    {currentNav.step}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate mt-1 font-medium">
                  {currentNav.desc}
                </p>
              </div>

              {/* Center Step-by-Step Flow Pills (Addresses: "what option means what") */}
              <div className="hidden xl:flex items-center bg-[#F4F6F9] p-1.5 rounded-2xl border border-fog text-xs gap-1">
                <span className="text-[10px] font-bold text-slate/80 uppercase px-2">Pipeline:</span>
                {NAV_ITEMS.slice(1).map((stepItem, idx) => {
                  const isCurrent = location.pathname.startsWith(stepItem.to);
                  return (
                    <button
                      key={stepItem.to}
                      onClick={() => navigate(stepItem.to)}
                      className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-ink text-white font-bold shadow-sm'
                          : 'text-slate hover:text-ink hover:bg-white/60'
                      }`}
                    >
                      <span className="opacity-60">{idx + 1}.</span>
                      <span>{stepItem.label.split('. ')[1]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Profile & Controls */}
              <div className="flex items-center gap-3 self-end lg:self-auto">
                <HindiToggle />

                {/* Role Switcher Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className="flex items-center gap-2.5 bg-paper hover:bg-fog/60 border border-fog px-3.5 py-2 rounded-2xl transition text-xs font-medium text-ink shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center font-bold text-xs">
                      {role === 'student' ? 'S' : role === 'institution' ? 'C' : 'A'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] text-slate uppercase font-semibold leading-none">Perspective</p>
                      <p className="font-bold text-ink leading-tight capitalize mt-0.5">
                        {role === 'student' ? 'Student View' : role === 'institution' ? 'College Admin' : 'AICTE Regulator'}
                      </p>
                    </div>
                    <ChevronDown size={14} className="text-slate" />
                  </button>

                  {roleDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-fog rounded-2xl shadow-xl p-2 z-50 text-xs">
                      <p className="px-3 py-2 text-[10px] font-bold uppercase text-slate border-b border-fog">
                        Switch Live Perspective:
                      </p>
                      <button
                        onClick={() => handleRoleSwitch('officer')}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                          role === 'officer' ? 'bg-ink text-white font-bold' : 'hover:bg-paper text-ink'
                        }`}
                      >
                        <span>AICTE Central Regulator</span>
                        {role === 'officer' && <CheckCircle2 size={14} />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('institution')}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                          role === 'institution' ? 'bg-ink text-white font-bold' : 'hover:bg-paper text-ink'
                        }`}
                      >
                        <span>College Registrar View</span>
                        {role === 'institution' && <CheckCircle2 size={14} />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('student')}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                          role === 'student' ? 'bg-ink text-white font-bold' : 'hover:bg-paper text-ink'
                        }`}
                      >
                        <span>Student Citizen Portal</span>
                        {role === 'student' && <CheckCircle2 size={14} />}
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

          {/* ── FOOTER BAR ────────────────────────────────────────────────────── */}
          <footer className="mt-8 pt-4 border-t border-fog flex flex-col sm:flex-row items-center justify-between text-xs text-slate gap-2">
            <div>
              <strong className="text-ink font-semibold">SAKSHI</strong> · Smart India Hackathon 2026 (PS SIH26263, AICTE Regulation Bureau)
            </div>
            <div className="flex items-center gap-4">
              <span className="text-jade font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> Zero Raw PII Stored
              </span>
              <span>•</span>
              <button
                onClick={() => setShowDemoModal(true)}
                className="text-crimson font-bold hover:underline flex items-center gap-1"
              >
                <Sparkles size={13} /> Open Judge Demo Walkthrough
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Guided 4-Story Demo Tour Modal */}
      {showDemoModal && (
        <DemoMode onClose={() => setShowDemoModal(false)} />
      )}
    </div>
  );
}
