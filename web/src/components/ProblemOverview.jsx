import React, { useState } from 'react';
import {
  AlertTriangle, ShieldAlert, Users, Database, ArrowRight,
  CheckCircle2, ChevronDown, ChevronUp, Sparkles, Building2, EyeOff
} from 'lucide-react';

/**
 * ProblemOverview.jsx — Visual presentation of AICTE Problem Statement SIH26263.
 * Illustrates the 4 core institutional data crises and SAKSHI's innovative solutions.
 */
export default function ProblemOverview() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const PROBLEMS = [
    {
      id: 'ghost',
      title: 'Statistical Blindness & Ghost Enrolments',
      badge: 'Challenge 01',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
          <path d="M9 10h.01M15 10h.01" />
          <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
        </svg>
      ),
      crisis: 'Institutions report aggregated headcount numbers (e.g. "We admitted 240") during approvals. AICTE cannot verify if real students exist, enabling phantom registrations to claim scholarship grants and meet AICTE faculty-student ratios.',
      solution: 'Lock 1 Ingestion + Citizen Window: Real-time HMAC tokenization combined with a student dispute button ("This is not me") where affected citizens immediately flag ghost seat attempts.',
      metric: '110 Cluster Flags Caught',
      metricSub: 'Rule R6 Identical Records',
    },
    {
      id: 'dual',
      title: 'Inter-State Dual Seat Hoarding',
      badge: 'Challenge 02',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
          <rect x="2" y="7" width="9" height="14" rx="2" />
          <rect x="13" y="7" width="9" height="14" rx="2" />
          <path d="M16 3l-4 4-4-4" />
        </svg>
      ),
      crisis: 'During counselling, affluent candidates hold seats in two different institutions simultaneously (e.g. MIT Pune and RV College Bengaluru), blocking deserving waitlisted candidates until admissions close.',
      solution: 'Lock 2 Blind Token Radar (Rule R1): Deterministic cross-institution duplicate detection identifies identical student seals in milliseconds without disclosing candidate names or identity.',
      metric: '100% Precision & Recall',
      metricSub: 'Rule R1 Dual-Seat Radar',
    },
    {
      id: 'overrun',
      title: 'Sanctioned Intake Overruns',
      badge: 'Challenge 03',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      ),
      crisis: 'Colleges quietly admit students past their approved intake (e.g. 312 students in a 240-capacity batch, 130%), diluting infrastructure, lab resources, and educational standards without AICTE awareness.',
      solution: 'Lock 3 Quota Ledger (Rule R3): Granular real-time accounting across 5 distinct quotas (Approved, Supernumerary, NRI, OCI, FN) with automated admission velocity alerts.',
      metric: '130% Overrun Detected',
      metricSub: 'Rule R3 Capacity Lockout',
    },
    {
      id: 'dpdp',
      title: 'Central Database Surveillance & DPDP Risk',
      badge: 'Challenge 04',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      crisis: 'Collecting raw 12-digit Aadhaar / APAAR numbers from 10+ million students creates a massive national surveillance honeypot and violates Section 6 of India’s DPDP Act 2023.',
      solution: 'Mathematical Zero-PII Architecture: Ephemeral in-memory source verification + blind cohort-salted HMAC tokens. Raw IDs are never stored, logged, or transmitted.',
      metric: '0 Raw IDs Stored',
      metricSub: '19 DB Tables Verified Clean',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/60 relative overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header Row */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-700/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold uppercase tracking-wider">
              Problem Statement SIH26263
            </span>
            <span className="text-xs text-slate-400 font-medium">
              AICTE Regulation Bureau
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-white">
            The Institutional Data Crisis & Why SAKSHI Was Built
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            AICTE currently receives aggregated numbers without student-level authentication. SAKSHI solves all four regulatory vulnerabilities with <strong>Zero-Knowledge Blind Verification</strong>.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="self-start md:self-center px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-600/60 transition shadow-xs"
        >
          <span>{isOpen ? 'Compact View' : 'Explore All 4 Challenges'}</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* 4 Interactive Problem Cards */}
      {isOpen && (
        <div className="relative z-10 pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {PROBLEMS.map((prob, idx) => (
              <div
                key={prob.id}
                onClick={() => setActiveTab(idx)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  activeTab === idx
                    ? 'bg-slate-800/90 border-blue-400 shadow-md scale-[1.02]'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center">
                    {prob.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prob.badgeColor}`}>
                    {prob.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white font-display line-clamp-1">
                  {prob.title}
                </h3>
                <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-blue-300">{prob.metric}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[110px]">{prob.metricSub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Expanded Detail Panel for Selected Challenge */}
          <div className="bg-slate-800/90 border border-slate-700/90 rounded-2xl p-5 sm:p-6 shadow-inner">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Left Column: The Crisis */}
              <div className="lg:col-span-6 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    The Current AICTE Pain Point:
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white font-display">
                  {PROBLEMS[activeTab].title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {PROBLEMS[activeTab].crisis}
                </p>
              </div>

              {/* Center Divider Arrow */}
              <div className="hidden lg:flex lg:col-span-1 justify-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center">
                  <ArrowRight size={16} />
                </div>
              </div>

              {/* Right Column: SAKSHI Innovation */}
              <div className="lg:col-span-5 bg-slate-900/90 border border-slate-700 rounded-xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    SAKSHI Engineering Innovation:
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {PROBLEMS[activeTab].solution}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Validated Impact:</span>
                  <span className="font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                    {PROBLEMS[activeTab].metric}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

