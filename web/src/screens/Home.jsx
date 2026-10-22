/**
 * Home.jsx — Executive Overview & Navigation Center.
 *
 * Implements layout and harmonic palette matching the executive reference:
 * - Top Left: Hero Card (Portfolio Enrolment Volume & verification chart).
 * - Top Right: 3 Pastel Stat Cards (Duplicate Cases, Lawful Opt-outs, Capacity Overruns).
 * - Bottom Left: Flagged Admission Incidents with clean icon rows.
 * - Bottom Right: High-contrast Dark Judge Tour Card.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, RadioTower, BarChart3, Award, UserCheck,
  ShieldCheck, Sparkles, ArrowRight, CheckCircle2, AlertTriangle,
  ChevronRight, Filter, Shield, Clock, ExternalLink, SlidersHorizontal
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import Seal from '../components/Seal';
import DemoMode from '../components/DemoMode';
import ProblemOverview from '../components/ProblemOverview';
import CollegeEmblem from '../components/CollegeEmblem';

export default function Home() {
  const { t } = useI18n();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('Season');

  useEffect(() => {
    api.getOverview(2026, token)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback demo stats
        setStats({
          total_institutions: 15,
          total_seats: 3333,
          verified_seats: 2570,
          coverage_pct: 77.1,
          open_flags: 123,
          open_cases: 6,
        });
        setLoading(false);
      });
  }, [token]);

  // Live Incident Feed for the table
  const INCIDENTS = [
    {
      id: 1,
      code: 'R1',
      college: 'MIT Pune & RV College Bengaluru',
      subtext: 'B.Tech CSE · Regular Full-Time',
      rule: 'R1 — Dual Enrolment',
      explanation: 'Identical student seal active in 2 institutions simultaneously.',
      severity: 'High',
      tag: 'Duplicate Seat',
      route: '/radar',
    },
    {
      id: 2,
      code: 'R3',
      college: 'MIT Pune (Cohort 2026)',
      subtext: 'B.Tech CSE · Approved 240 / Actual 312',
      rule: 'R3 — Intake Overrun',
      explanation: 'College admitted 312 students against 240 approved intake (130%).',
      severity: 'Critical',
      tag: 'Over Capacity',
      route: '/integrity',
    },
    {
      id: 3,
      code: 'R4',
      college: 'SSN College of Engineering, Chennai',
      subtext: 'B.Tech IT · Burst Batch Upload',
      rule: 'R4 — Upload Burst',
      explanation: 'Batch reporting velocity is 3.1x higher than regional peer average.',
      severity: 'Medium',
      tag: 'Volume Spike',
      route: '/integrity',
    },
    {
      id: 4,
      code: 'DISP',
      college: 'SSN Chennai (Meera Pillai Claim)',
      subtext: 'B.Tech CSE · Student Dispute',
      rule: 'Citizen Dispute',
      explanation: 'Student pressed "This is not me" against unauthorized registration.',
      severity: 'High',
      tag: 'Ghost Seat',
      route: '/citizen',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── PROBLEM STATEMENT & AICTE CRISIS OVERVIEW ──────────────────────── */}
      <ProblemOverview />

      {/* ── ROW 1: PORTFOLIO & ASSET STAT CARDS ───────────────────────────── */}
      <div>
        {/* Section Titles Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-2.5 px-0.5">
          <div className="lg:col-span-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 tracking-tight font-display">
              Admission Portfolio
            </h2>
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              15 AICTE Institutions
            </span>
          </div>
          <div className="lg:col-span-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 tracking-tight font-display">
              Integrity Assets
            </h2>
            <button
              onClick={() => navigate('/integrity')}
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium transition"
            >
              <SlidersHorizontal size={12} />
              <span>Filter Rules</span>
            </button>
          </div>
        </div>

        {/* Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Left Hero Card: National Enrolment Portfolio (Light Blue Tint) */}
          <div className="lg:col-span-6 bg-[#F0F6FF] border border-[#DBEAFE] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs relative overflow-hidden">
            {/* Top Stat */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Total Active Enrolments
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-gray-950 font-display tracking-tight">
                    {loading ? '…' : (stats?.total_seats || 3333).toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    Seats Indexed
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Across 15 approved institutions · Verified via blind HMAC seals
                </p>
              </div>

              {/* Verified Pill Badge (Dark obsidian pill like reference image) */}
              <div className="bg-[#181A20] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>2,570 Verified (77.1%)</span>
              </div>
            </div>

            {/* Smooth SVG Intake Curve with Gradient */}
            <div className="py-2 my-1">
              <svg viewBox="0 0 400 80" className="w-full h-18 overflow-visible">
                <defs>
                  <linearGradient id="blueCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,65 Q 60,55 120,45 T 200,38 T 280,26 T 340,12 L 400,8 L 400,80 L 0,80 Z"
                  fill="url(#blueCurveGrad)"
                />
                <path
                  d="M 0,65 Q 60,55 120,45 T 200,38 T 280,26 T 340,12 L 400,8"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="340" cy="12" r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-[#DBEAFE]/80 text-xs">
              <div className="flex items-center gap-1">
                {['1W', '1M', 'Season', 'All'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      chartPeriod === period
                        ? 'bg-gray-950 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigate('/upload')}
                className="font-bold text-gray-900 hover:text-blue-600 flex items-center gap-1 text-xs transition"
              >
                <span>Upload Batch CSV</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Right 3 Pastel Stat Cards (Matches Lavender BTC, Mint LTC, Cream ETH) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Card 1: Duplicate Radar (Soft Pastel Lavender) */}
            <div
              onClick={() => navigate('/radar')}
              className="bg-[#F3E8FF] border border-[#E9D5FF] rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition cursor-pointer shadow-xs group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6B21A8] uppercase tracking-wider">
                    Duplicates
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center text-[#7E22CE] shadow-2xs group-hover:bg-white transition">
                    <RadioTower size={14} />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-extrabold text-gray-950 font-display">
                    6 Cases
                  </span>
                  <p className="text-[11px] text-[#6B21A8] font-medium mt-0.5">
                    Dual college seats
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#7E22CE] shadow-2xs">
                  Rule R1
                </span>
                <span className="text-[11px] font-bold text-[#7E22CE]">
                  100% Prec.
                </span>
              </div>
            </div>

            {/* Card 2: Lawful Opt-Outs (Soft Pastel Mint) */}
            <div
              onClick={() => navigate('/integrity')}
              className="bg-[#DCFCE7] border border-[#BBF7D0] rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition cursor-pointer shadow-xs group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider">
                    Coverage
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center text-[#16A34A] shadow-2xs group-hover:bg-white transition">
                    <Shield size={14} />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-extrabold text-gray-950 font-display">
                    15 Insts.
                  </span>
                  <p className="text-[11px] text-[#15803D] font-medium mt-0.5">
                    5 States monitored
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#15803D] shadow-2xs">
                  AICTE OK
                </span>
                <span className="text-[11px] font-bold text-[#15803D]">
                  +77.1%
                </span>
              </div>
            </div>

            {/* Card 3: DPDP Compliant (Soft Pastel Butter) */}
            <div
              onClick={() => navigate('/proof')}
              className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition cursor-pointer shadow-xs group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#B45309] uppercase tracking-wider">
                    DPDP Proof
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center text-[#D97706] shadow-2xs group-hover:bg-white transition">
                    <CheckCircle2 size={14} />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-extrabold text-gray-950 font-display">
                    0 PII
                  </span>
                  <p className="text-[11px] text-[#B45309] font-medium mt-0.5">
                    Zero raw IDs stored
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#B45309] shadow-2xs">
                  DPDP 2023
                </span>
                <span className="text-[11px] font-bold text-[#B45309]">
                  100% Legal
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── ROW 2: INCIDENT RADAR TABLE & OBSIDIAN TOUR CARD ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Section: Live Incidents Table (Clean, Compact, Easy to Read) */}
        <div className="lg:col-span-7 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">
                  Recent Verification Incidents
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Algorithmic detections requiring regulator notice or review
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600 font-medium">
                  Active (4)
                </span>
              </div>
            </div>

            {/* Compact Incident Rows */}
            <div className="divide-y divide-gray-100">
              {INCIDENTS.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-gray-50/70 rounded-xl px-2 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Institutional Emblem */}
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <CollegeEmblem name={item.college} size={28} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                          {item.college}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          item.severity === 'Critical'
                            ? 'bg-red-50 text-red-700 border border-red-200/60'
                            : item.severity === 'High'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {item.explanation}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(item.route)}
                    className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-950 hover:text-white border border-gray-200 text-xs font-semibold text-gray-800 transition flex items-center gap-1 flex-shrink-0 shadow-2xs"
                  >
                    <span>Inspect</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Deterministic detection · Cites AICTE Handbook clauses</span>
            <button
              onClick={() => navigate('/radar')}
              className="text-gray-900 font-bold hover:text-blue-600 flex items-center gap-1 transition"
            >
              <span>View All 123 Flags</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Right Section: Obsidian Guided Tour Card (Exact match to Coinview Earn card) */}
        <div className="lg:col-span-5 bg-[#181A20] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Decorative Geometric Wireframe lines */}
          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none">
            <svg width="220" height="180" viewBox="0 0 220 180" fill="none">
              <path d="M 40,160 L 180,60 L 210,140 Z" stroke="#FFFFFF" strokeWidth="1.5" />
              <path d="M 10,130 L 150,30 L 190,110 Z" stroke="#FFFFFF" strokeWidth="1.5" />
              <path d="M 60,170 L 200,80" stroke="#FFFFFF" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#BFDBFE]">
              <Sparkles size={12} className="text-[#BFDBFE]" />
              <span>SIH Evaluator Quick-Start</span>
            </div>

            <h3 className="font-display font-extrabold text-xl sm:text-2xl leading-tight text-white tracking-tight">
              Judge 2-Minute Guided Tour
            </h3>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Experience the 4 real-world test scenarios: Asha's opt-out, Ravi's dual seat, Meera's ghost seat, and employer QR verification.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setShowDemoModal(true)}
                className="bg-[#BFDBFE] hover:bg-white text-gray-950 font-bold text-xs py-2.5 px-5 rounded-full transition shadow-sm flex items-center gap-2"
              >
                <span>Start Interactive Tour ➔</span>
              </button>
            </div>
          </div>

          {/* Quick Scenario Shortcuts */}
          <div className="pt-4 border-t border-white/10 space-y-2 text-xs relative z-10 mt-5">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              One-Click Demonstrations:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => navigate('/radar')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition flex items-center justify-between"
              >
                <span className="text-gray-300 text-[11px] truncate">Ravi: 2 Seats</span>
                <ArrowRight size={11} className="text-[#BFDBFE]" />
              </div>
              <div
                onClick={() => navigate('/citizen')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition flex items-center justify-between"
              >
                <span className="text-gray-300 text-[11px] truncate">Meera: Ghost Seat</span>
                <ArrowRight size={11} className="text-[#BFDBFE]" />
              </div>
              <div
                onClick={() => navigate('/architecture')}
                className="col-span-2 p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 cursor-pointer transition flex items-center justify-between border border-blue-400/30 text-blue-200"
              >
                <span className="text-[11px] font-bold">⚡ 3D Cryptographic Vault, Architecture & Tech Stack</span>
                <ArrowRight size={11} className="text-[#BFDBFE]" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Guided Tour Modal */}
      {showDemoModal && (
        <DemoMode onClose={() => setShowDemoModal(false)} />
      )}
    </div>
  );
}
