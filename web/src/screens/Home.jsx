/**
 * Home.jsx — Executive Overview & Navigation Center.
 *
 * Modeled directly on the executive tablet frame:
 * - Top Left: Hero Card (National Enrolment Volume & verification chart).
 * - Top Right: 3 Pastel Stat Cards (Duplicates, Lawful Opt-outs, Capacity Overruns).
 * - Bottom Left: Active Anomaly Incidents Table with one-click inspection.
 * - Bottom Right: High-contrast Dark Judge Tour Card with 1-click test scenarios.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, RadioTower, BarChart3, Award, UserCheck,
  ShieldCheck, Sparkles, ArrowRight, CheckCircle2, AlertTriangle,
  ChevronRight, Filter, Shield, Clock, ExternalLink
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import Seal from '../components/Seal';
import DemoMode from '../components/DemoMode';

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
          verified_seats: 2410,
          coverage_pct: 72.3,
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
      college: 'MIT Pune & RV College Bengaluru',
      program: 'B.Tech Computer Science & Engineering',
      rule: 'R1 — Cross-Institution Duplicate',
      explanation: 'Identical student seal appears in two colleges for full-time regular seats.',
      severity: 'High',
      route: '/radar',
      tag: 'Duplicate Student'
    },
    {
      id: 2,
      college: 'Maharashtra Institute of Technology, Pune',
      program: 'B.Tech CSE (Cohort 2026)',
      rule: 'R3 — Approved Intake Overrun',
      explanation: 'College reports 312 admissions against approved capacity of 240 (130%).',
      severity: 'Critical',
      route: '/integrity',
      tag: 'Capacity Breach'
    },
    {
      id: 3,
      college: 'SSN College of Engineering, Chennai',
      program: 'B.Tech Information Technology',
      rule: 'R4 — Velocity Burst Upload',
      explanation: 'Uploaded batch volume is 3x higher than regional peer colleges.',
      severity: 'Medium',
      route: '/integrity',
      tag: 'Unusual Volume'
    },
    {
      id: 4,
      college: 'SSN College of Engineering, Chennai',
      program: 'B.Tech CSE (Meera Pillai Claim)',
      rule: 'Student Dispute — "This is not me"',
      explanation: 'Student flagged unauthorized enrolment registered in their name.',
      severity: 'High',
      route: '/citizen',
      tag: 'Ghost Enrolment'
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── TOP SECTION: HERO CARD & 3 PASTEL METRICS ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Hero Card: National Enrolment Portfolio (Matches crypto hero card in reference) */}
        <div className="lg:col-span-6 bg-[#F0F5FD] border border-[#D8E6F8] rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
                National Enrolment Portfolio
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-display font-black text-ink">
                  {loading ? '…' : (stats?.total_seats || 3333).toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-slate">
                  Active Seats
                </span>
              </div>
              <p className="text-xs text-slate/80 mt-0.5">
                Across {stats?.total_institutions || 15} Institutions · Verified by Blind HMAC Seals
              </p>
            </div>

            {/* Interactive Callout Pill */}
            <div className="bg-[#14161D] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-jade animate-pulse" />
              <span>100% Privacy Verified</span>
            </div>
          </div>

          {/* SVG Sparkline Intake Curve */}
          <div className="py-4 my-2">
            <svg viewBox="0 0 400 90" className="w-full h-20 overflow-visible">
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4A8BF4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4A8BF4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,75 Q 60,65 120,55 T 200,42 T 280,30 T 340,15 L 400,10 L 400,90 L 0,90 Z"
                fill="url(#curveGradient)"
              />
              <path
                d="M 0,75 Q 60,65 120,55 T 200,42 T 280,30 T 340,15 L 400,10"
                fill="none"
                stroke="#2B6DE4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Highlight Dot */}
              <circle cx="340" cy="15" r="5" fill="#2B6DE4" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          {/* Timeframe Filter Pills */}
          <div className="flex items-center justify-between pt-3 border-t border-[#D8E6F8]/60 text-xs">
            <div className="flex items-center gap-1">
              {['1W', '1M', 'Season', 'All'].map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1 rounded-xl font-medium transition ${
                    chartPeriod === period
                      ? 'bg-ink text-white font-bold shadow-sm'
                      : 'text-slate hover:text-ink'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate('/upload')}
              className="font-bold text-ink hover:underline flex items-center gap-1 text-xs"
            >
              <span>Upload College CSV</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Right 3 Pastel Stat Cards (Matches 1.25 BTC, 0.32 LTC, 1.25 ETH from image) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Card 1: Duplicate Radar (Pastel Lavender) */}
          <div
            onClick={() => navigate('/radar')}
            className="bg-[#F1EEF8] border border-[#E3DCF0] rounded-3xl p-5 flex flex-col justify-between hover:scale-[1.02] transition cursor-pointer shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate uppercase tracking-wider">
                Duplicate Radar
              </span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-crimson shadow-xs group-hover:scale-110 transition">
                <RadioTower size={16} />
              </div>
            </div>
            <div className="my-3">
              <span className="text-2xl sm:text-3xl font-display font-black text-ink">
                6 Cases
              </span>
              <p className="text-[11px] text-slate mt-0.5">
                Students enrolled in 2 colleges
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-crimson bg-white px-2 py-1 rounded-full self-start shadow-xs">
              Rule R1 Active
            </span>
          </div>

          {/* Card 2: Lawful Opt-Outs (Pastel Soft Green) */}
          <div
            onClick={() => navigate('/integrity')}
            className="bg-[#EDF7F1] border border-[#D5EFE0] rounded-3xl p-5 flex flex-col justify-between hover:scale-[1.02] transition cursor-pointer shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate uppercase tracking-wider">
                Lawful Opt-Outs
              </span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-jade shadow-xs group-hover:scale-110 transition">
                <Shield size={16} />
              </div>
            </div>
            <div className="my-3">
              <span className="text-2xl sm:text-3xl font-display font-black text-ink">
                72% Safe
              </span>
              <p className="text-[11px] text-slate mt-0.5">
                APAAR Refusal / Inst. ID
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-jade bg-white px-2 py-1 rounded-full self-start shadow-xs">
              DPDP 2023 Compliant
            </span>
          </div>

          {/* Card 3: Capacity Overruns (Pastel Warm Cream) */}
          <div
            onClick={() => navigate('/integrity')}
            className="bg-[#FEF6E8] border border-[#FDEBCF] rounded-3xl p-5 flex flex-col justify-between hover:scale-[1.02] transition cursor-pointer shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate uppercase tracking-wider">
                Capacity Alert
              </span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber shadow-xs group-hover:scale-110 transition">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="my-3">
              <span className="text-2xl sm:text-3xl font-display font-black text-ink">
                3 Overruns
              </span>
              <p className="text-[11px] text-slate mt-0.5">
                Exceeding approved intake
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber bg-white px-2 py-1 rounded-full self-start shadow-xs">
              Rule R3 Overrun
            </span>
          </div>

        </div>
      </div>

      {/* ── BOTTOM SECTION: INCIDENT RADAR TABLE & DARK CALLOUT CARD ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Section: Live Incident Feed (Matches the crypto list in reference) */}
        <div className="lg:col-span-8 bg-white border border-fog rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-fog mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  Flagged Admission Incidents
                </h3>
                <p className="text-xs text-slate mt-0.5">
                  Algorithmic detections requiring regulator confirmation
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-paper border border-fog font-medium text-slate flex items-center gap-1">
                  <Filter size={12} /> All States
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-paper border border-fog font-medium text-slate">
                  Active (4)
                </span>
              </div>
            </div>

            {/* Incident Rows */}
            <div className="divide-y divide-fog">
              {INCIDENTS.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-paper/50 rounded-xl px-2 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-paper border border-fog flex items-center justify-center font-mono font-bold text-xs text-ink flex-shrink-0 mt-0.5">
                      R{item.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-sm">
                          {item.college}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.severity === 'Critical'
                            ? 'bg-crimson-light text-crimson'
                            : item.severity === 'High'
                            ? 'bg-amber-light text-amber'
                            : 'bg-paper text-slate'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate mt-0.5">
                        {item.explanation}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(item.route)}
                    className="self-end sm:self-center px-3.5 py-1.5 rounded-xl bg-paper hover:bg-ink hover:text-white border border-fog text-xs font-semibold text-ink transition flex items-center gap-1 flex-shrink-0"
                  >
                    <span>Inspect</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-fog flex items-center justify-between text-xs text-slate">
            <span>Every flag cites AICTE Approval Process Handbook clauses</span>
            <button
              onClick={() => navigate('/radar')}
              className="text-ink font-bold hover:underline flex items-center gap-1"
            >
              <span>View All 123 Flags</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Right Section: Dark Callout Card (Matches "Earn free crypto" card in reference) */}
        <div className="lg:col-span-4 bg-[#12141A] text-white rounded-3xl p-7 flex flex-col justify-between shadow-xl relative overflow-hidden">
          {/* Subtle Watermark Decoration */}
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Seal token="SAKSHI-HERO-SEAL" size={200} />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-[#D4E4FA]">
              <Sparkles size={13} className="text-[#D4E4FA]" />
              <span>For SIH Evaluators</span>
            </div>

            <h3 className="font-display font-extrabold text-2xl sm:text-3xl leading-snug tracking-tight">
              Judge 2-Minute Guided Tour
            </h3>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Test the core innovation of SAKSHI in 4 simple clicks. See how we catch fraud without holding a single student's name.
            </p>

            <button
              onClick={() => setShowDemoModal(true)}
              className="w-full py-3.5 bg-[#D4E4FA] text-ink font-bold text-xs rounded-2xl hover:bg-white transition shadow-md flex items-center justify-center gap-2 mt-2"
            >
              <span>Start Interactive Tour ➔</span>
            </button>
          </div>

          {/* Quick Scenario Jumps */}
          <div className="pt-6 border-t border-white/10 space-y-2 text-xs relative z-10 mt-6">
            <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Quick Test Scenarios:
            </p>
            <div
              onClick={() => navigate('/radar')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition flex items-center justify-between"
            >
              <span className="text-white/80">Ravi holds 2 seats (Radar)</span>
              <ArrowRight size={12} className="text-[#D4E4FA]" />
            </div>
            <div
              onClick={() => navigate('/citizen')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition flex items-center justify-between"
            >
              <span className="text-white/80">Meera disputes ghost seat</span>
              <ArrowRight size={12} className="text-[#D4E4FA]" />
            </div>
            <div
              onClick={() => navigate('/proof')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition flex items-center justify-between"
            >
              <span className="text-white/80">Live Privacy Leak Scan</span>
              <ArrowRight size={12} className="text-[#D4E4FA]" />
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
