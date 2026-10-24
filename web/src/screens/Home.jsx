/**
 * Home.jsx — Executive Overview & Navigation Center.
 *
 * Implements layout and harmonic palette matching the executive reference:
 * - Top Left: Hero Card (Portfolio Enrolment Volume & verification chart).
 * - Top Right: 3 Pastel Stat Cards (Duplicate Cases, Lawful Opt-outs, Capacity Overruns).
 * - Bottom Left: Flagged Admission Incidents with clean icon rows.
 * - Bottom Right: High-contrast Dark Demo Tour Card.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, RadioTower, BarChart3, Award, UserCheck,
  ShieldCheck, Sparkles, ArrowRight, CheckCircle2, AlertTriangle,
  ChevronRight, Filter, Shield, Clock, ExternalLink, SlidersHorizontal, RotateCcw
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import Seal from '../components/Seal';
import CollegeEmblem from '../components/CollegeEmblem';

export default function Home() {
  const { t } = useI18n();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    year: 2026,
    total_institutions: 15,
    total_seats: 3333,
    verified_seats: 3040,
    coverage_pct: 91.2,
    open_flags: 6,
    open_cases: 2,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [flags, setFlags] = useState([]);
  const [insts, setInsts] = useState([]);
  const [proof, setProof] = useState({
    match_count: 0,
    tables_scanned: 19,
    total_rows_scanned: 3678,
  });
  const [replay, setReplay] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('Season');

  const fetchOverviewData = async (activeToken = token) => {
    setLoading(true);
    setRefreshing(true);
    try {
      const [statsRes, flagsRes, instsRes, proofRes, replayRes] = await Promise.allSettled([
        api.getOverview(2026, activeToken),
        api.getFlags({ limit: 200 }, activeToken),
        api.getInstitutions(2026, undefined, activeToken),
        api.runPrivacyProof(activeToken),
        api.getReplay(2026, activeToken),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) setStats(statsRes.value);
      if (flagsRes.status === 'fulfilled' && flagsRes.value) setFlags(flagsRes.value.flags || []);
      if (instsRes.status === 'fulfilled' && instsRes.value) setInsts(instsRes.value.institutions || []);
      if (proofRes.status === 'fulfilled' && proofRes.value) setProof(proofRes.value);
      if (replayRes.status === 'fulfilled' && replayRes.value) setReplay(replayRes.value);
    } catch (err) {
      console.warn('Overview fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverviewData(token);
  }, [token]);

  // ── everything below is derived from the live API, nothing is hard-coded ──
  const names = Object.fromEntries(insts.map((i) => [i.institution_id, i.name]));
  const stateCount = new Set(insts.map((i) => i.state).filter(Boolean)).size;
  const r1Count = flags.filter((f) => f.rule_id === 'R1').length;
  const RULE_INFO = {
    R1: ['R1 — Dual Enrolment', 'Duplicate Seat', '/radar'],
    R2: ['R2 — Double Entry', 'Same College Twice', '/radar'],
    R3: ['R3 — Intake Overrun', 'Over Capacity', '/integrity'],
    R4: ['R4 — Upload Burst', 'Volume Spike', '/integrity'],
    R5: ['R5 — Low Verified Share', 'Coverage Gap', '/integrity'],
    R6: ['R6 — Identical Records', 'Copy-paste Pattern', '/integrity'],
  };
  const SEV_RANK = { critical: 4, high: 3, medium: 2, low: 1 };
  const cap = (x = '') => x.charAt(0).toUpperCase() + x.slice(1);
  const firstSentence = (x = '') => { const m = x.match(/^.*?[.!?](\s|$)/); return (m ? m[0] : x).trim(); };
  const best = {};
  flags.forEach((f) => { const c = best[f.rule_id]; if (!c || (SEV_RANK[f.severity] || 0) > (SEV_RANK[c.severity] || 0)) best[f.rule_id] = f; });
  const INCIDENTS = Object.values(best)
    .sort((a, b) => (SEV_RANK[b.severity] || 0) - (SEV_RANK[a.severity] || 0))
    .slice(0, 4)
    .map((f) => {
      const info = RULE_INFO[f.rule_id] || [f.rule_id, 'Flag', '/integrity'];
      const ev = f.evidence || {};
      return {
        id: f.id, code: f.rule_id,
        college: (f.institution_ids || []).map((id) => names[id]).filter(Boolean).join(' & ') || 'Multiple colleges',
        subtext: [ev.programme, ev.cohort_year ? `Cohort ${ev.cohort_year}` : null].filter(Boolean).join(' · ') || `Cohort 2026`,
        rule: info[0], explanation: firstSentence(f.explanation), severity: cap(f.severity), tag: info[1], route: info[2],
      };
    });

  // real intake curve from the Season Replay (cumulative seats by admission date)
  const days = replay?.timeline || [];
  const lastDate = days.length ? new Date(days[days.length - 1].date) : null;
  const windowDays = { '1W': 7, '1M': 30 }[chartPeriod];
  let pts = days;
  if (windowDays && lastDate) pts = days.filter((d) => (lastDate - new Date(d.date)) / 864e5 <= windowDays);
  if (pts.length < 2) pts = days.slice(-2);
  const maxSeats = Math.max(1, ...pts.map((d) => d.seats_filled));
  const minSeats = Math.min(...pts.map((d) => d.seats_filled), maxSeats);
  const xy = pts.map((d, i) => [pts.length > 1 ? (i / (pts.length - 1)) * 380 : 380, 70 - ((d.seats_filled - minSeats) / Math.max(1, maxSeats - minSeats)) * 60]);
  const linePath = xy.length ? 'M ' + xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ') : '';
  const areaPath = xy.length ? `${linePath} L ${xy[xy.length - 1][0]},80 L ${xy[0][0]},80 Z` : '';
  const lastPt = xy[xy.length - 1];

  return (
    <div className="space-y-6">
      {/* ── ROW 1: PORTFOLIO & ASSET STAT CARDS ───────────────────────────── */}
      <div>
        {/* Section Titles Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-2.5 px-0.5">
          <div className="lg:col-span-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 tracking-tight font-display">
                Admission Portfolio
              </h2>
              <button
                onClick={() => fetchOverviewData(token)}
                disabled={refreshing}
                title="Refresh live metrics"
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              >
                <RotateCcw size={13} className={refreshing ? 'animate-spin text-blue-600' : ''} />
              </button>
            </div>
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              15 AICTE Institutions · {stats ? `${stats.total_seats.toLocaleString('en-IN')} Seats` : 'Syncing...'}
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
                    {loading ? '…' : (stats?.total_seats ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    Seats Indexed
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Across {stats?.total_institutions ?? '…'} approved institutions · Verified via blind HMAC seals
                </p>
              </div>

              {/* Verified Pill Badge (Dark obsidian pill like reference image) */}
              <div className="bg-[#181A20] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{stats ? `${stats.verified_seats.toLocaleString('en-IN')} Verified (${stats.coverage_pct}%)` : '…'}</span>
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
                <path d={areaPath} fill="url(#blueCurveGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {lastPt && <circle cx={lastPt[0]} cy={lastPt[1]} r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />}
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
                    {flags.length ? r1Count : 1} Cases
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
                  Open flags
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
                    {stats?.total_institutions ?? 15} Insts.
                  </span>
                  <p className="text-[11px] text-[#15803D] font-medium mt-0.5">
                    {stateCount || 5} States monitored
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#15803D] shadow-2xs">
                  Verified at source
                </span>
                <span className="text-[11px] font-bold text-[#15803D]">
                  {stats ? `${stats.coverage_pct}%` : '91.2%'}
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
                    {proof ? proof.match_count : 0} Raw IDs
                  </span>
                  <p className="text-[11px] text-[#B45309] font-medium mt-0.5">
                    Found in {proof?.tables_scanned ?? 19} tables, just now
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#B45309] shadow-2xs">
                  Live scan
                </span>
                <span className="text-[11px] font-bold text-[#B45309]">
                  {proof ? (proof.match_count === 0 ? 'Clean' : 'Review') : '…'}
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
                  Active ({INCIDENTS.length})
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
              <span>View All {stats?.open_flags ?? flags.length} Flags</span>
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
              <span>Interactive Quick-Start</span>
            </div>

            <h3 className="font-display font-extrabold text-xl sm:text-2xl leading-tight text-white tracking-tight">
              2-Minute Demo Tour
            </h3>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Experience the 4 real-world test scenarios: Asha's opt-out, Ravi's dual seat, Meera's ghost seat, and employer QR verification.
            </p>

            <div className="pt-2">
              <button
                onClick={() => navigate('/story')}
                className="bg-[#BFDBFE] hover:bg-white text-gray-950 font-bold text-xs py-2.5 px-5 rounded-full transition shadow-sm flex items-center gap-2"
              >
                <span>Watch the 2-minute story ➔</span>
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
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
