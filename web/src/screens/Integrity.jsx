/**
 * Integrity.jsx — College-wise Integrity Score screen.
 *
 * Top: national summary (avg score, institutions below 50, open flags).
 * List: college cards with score number, score bar, expandable breakdown,
 *       coverage breakdown (verified/attested/pending), open-flag count.
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BarChart2, AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import HindiToggle from '../components/HindiToggle';

// ─── Seeded demo data ─────────────────────────────────────────────────────────

const DEMO_INSTITUTIONS = [
  {
    id: 'inst-001',
    name: 'Ambedkar Engineering College',
    state: 'Delhi',
    programme: 'B.Tech CSE',
    cohort: 2024,
    score: 84,
    open_flags: 1,
    breakdown: [
      { label: 'Overrun', delta: -4, detail: 'Reports 252 seats against approved 240 (105%). Rule R3.' },
      { label: 'Attested (APAAR opt-outs)', delta: -8, detail: '12% of seats verified by ABC/DigiLocker only. Rule R5.' },
      { label: 'Coverage', delta: -4, detail: '84% of seats have at least attested status. Rule R2.' },
    ],
    coverage: { verified: 72, attested: 16, pending: 12 },
  },
  {
    id: 'inst-002',
    name: 'Delhi Polytechnic Institute',
    state: 'Delhi',
    programme: 'B.Tech IT',
    cohort: 2024,
    score: 61,
    open_flags: 3,
    breakdown: [
      { label: 'Overrun', delta: -12, detail: 'Reports 312 seats against approved 240 (130%). Rule R3.' },
      { label: 'Duplicates', delta: -5, detail: '3 duplicate seals found per 1,000 seats. Rule R1.' },
      { label: 'Coverage', delta: -22, detail: 'Only 61% of seats are verified or attested. Rule R2.' },
    ],
    coverage: { verified: 45, attested: 16, pending: 39 },
  },
  {
    id: 'inst-003',
    name: 'Government College of Engineering, Pune',
    state: 'Maharashtra',
    programme: 'B.Tech Mech',
    cohort: 2024,
    score: 91,
    open_flags: 0,
    breakdown: [
      { label: 'Attested only', delta: -5, detail: '5% of seats verified by DigiLocker but not APAAR. Rule R5.' },
      { label: 'Minor coverage gap', delta: -4, detail: '91% assurance coverage. Rule R2.' },
    ],
    coverage: { verified: 88, attested: 7, pending: 5 },
  },
  {
    id: 'inst-004',
    name: 'NIT Jamshedpur',
    state: 'Jharkhand',
    programme: 'B.Tech Mech',
    cohort: 2024,
    score: 44,
    open_flags: 5,
    breakdown: [
      { label: 'Overrun', delta: -18, detail: 'Reports 420 seats against approved 300 (140%). Rule R3.' },
      { label: 'Duplicates', delta: -8, detail: '7 duplicate seals. Rule R1.' },
      { label: 'Low coverage', delta: -30, detail: 'Only 44% assurance coverage. Rule R2.' },
    ],
    coverage: { verified: 28, attested: 16, pending: 56 },
  },
  {
    id: 'inst-005',
    name: 'IIM Udaipur',
    state: 'Rajasthan',
    programme: 'MBA',
    cohort: 2024,
    score: 78,
    open_flags: 1,
    breakdown: [
      { label: 'Coverage gap', delta: -14, detail: '78% assurance coverage. Rule R2.' },
      { label: 'One duplicate', delta: -8, detail: '1 cross-institution duplicate seal. Rule R1.' },
    ],
    coverage: { verified: 62, attested: 16, pending: 22 },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 80) return 'text-jade';
  if (score >= 50) return 'text-amber';
  return 'text-crimson';
}

function scoreBgColor(score) {
  if (score >= 80) return 'bg-jade';
  if (score >= 50) return 'bg-amber';
  return 'bg-crimson';
}

// ─── Score bar (custom SVG-like CSS bar) ──────────────────────────────────────

function ScoreBar({ score }) {
  return (
    <div className="relative h-2 bg-fog rounded-full overflow-hidden">
      <div
        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${scoreBgColor(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

// ─── Coverage bars ────────────────────────────────────────────────────────────

function CoverageBars({ coverage }) {
  const { verified, attested, pending } = coverage;
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div
          className="bg-jade rounded-l-full"
          style={{ width: `${verified}%` }}
          title={`Verified: ${verified}%`}
        />
        <div
          className="bg-slate/30"
          style={{ width: `${attested}%` }}
          title={`Attested: ${attested}%`}
        />
        <div
          className="bg-fog rounded-r-full flex-1"
          title={`Pending: ${pending}%`}
        />
      </div>
      <div className="flex gap-4 mt-1.5 text-xs text-slate">
        <span><span className="font-medium text-jade">{verified}%</span> verified</span>
        <span><span className="font-medium text-ink">{attested}%</span> attested</span>
        <span><span className="font-medium text-slate">{pending}%</span> pending</span>
      </div>
    </div>
  );
}

// ─── Institution card ─────────────────────────────────────────────────────────

function InstitutionCard({ inst }) {
  const { t }       = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-white border border-fog overflow-hidden">
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-ink leading-snug">{inst.name}</h3>
            <p className="text-sm text-slate mt-0.5">{inst.programme} · {inst.cohort} · {inst.state}</p>
          </div>
          <div className={`text-4xl font-display font-bold tabular-nums flex-shrink-0 ${scoreColor(inst.score)}`}>
            {inst.score}
          </div>
        </div>

        {/* Score bar */}
        <ScoreBar score={inst.score} />
        <div className="flex items-center justify-between mt-1.5 text-xs text-slate">
          <span>Integrity score</span>
          <span>{inst.score}/100</span>
        </div>

        {/* Coverage */}
        <div className="mt-4">
          <p className="text-xs text-slate mb-1.5">{t('coverage2')}</p>
          <CoverageBars coverage={inst.coverage} />
        </div>

        {/* Open flags + expand */}
        <div className="flex items-center justify-between mt-4">
          {inst.open_flags > 0 ? (
            <div className="flex items-center gap-1.5 text-crimson text-sm">
              <AlertTriangle size={14} />
              <span className="font-medium">{inst.open_flags} {t('openFlags')}</span>
            </div>
          ) : (
            <span className="text-jade text-sm font-medium">No open flags</span>
          )}

          <button
            className="btn btn-ghost text-xs py-1 px-2 flex items-center gap-1"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
          >
            {t('scoreBreakdown')}
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expandable breakdown */}
      {open && (
        <div className="border-t border-fog bg-paper px-5 py-4 space-y-3">
          {inst.breakdown.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className={`text-sm font-bold flex-shrink-0 w-12 tabular-nums ${
                  item.delta < 0 ? 'text-crimson' : 'text-jade'
                }`}
              >
                {item.delta > 0 ? '+' : ''}{item.delta} pts
              </span>
              <div>
                <span className="text-sm font-medium text-ink">{item.label}: </span>
                <span className="text-sm text-slate">{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── National summary tile ────────────────────────────────────────────────────

function SummaryTile({ label, value, sub = '', colorClass = 'text-ink' }) {
  return (
    <div className="rounded-xl bg-white border border-fog p-4">
      <div className={`text-3xl font-display font-bold ${colorClass}`}>{value}</div>
      <div className="text-sm text-slate mt-1">{label}</div>
      {sub && <div className="text-xs text-slate/70 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Integrity() {
  const { t }     = useI18n();
  const { token } = useAuth();

  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    api.getInstitutions(year, '', token)
      .then(data => {
        setInstitutions(data?.institutions ?? DEMO_INSTITUTIONS);
        setLoading(false);
      })
      .catch(() => {
        setInstitutions(DEMO_INSTITUTIONS);
        setLoading(false);
      });
  }, [token]);

  const avgScore  = institutions.length
    ? Math.round(institutions.reduce((s, i) => s + i.score, 0) / institutions.length)
    : 0;
  const below50   = institutions.filter(i => i.score < 50).length;
  const openFlags = institutions.reduce((s, i) => s + i.open_flags, 0);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={20} className="text-ink" />
            <h1 className="font-display text-2xl font-bold text-ink">{t('integrity')}</h1>
          </div>
          <p className="text-slate text-sm max-w-xl">{t('integritySubtitle')}</p>
        </div>
        <HindiToggle />
      </div>

      {/* National summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryTile
          label={t('avgScore')}
          value={loading ? '…' : avgScore}
          sub="out of 100"
          colorClass={scoreColor(avgScore)}
        />
        <SummaryTile
          label={t('below50')}
          value={loading ? '…' : below50}
          sub="institutions"
          colorClass="text-crimson"
        />
        <SummaryTile
          label={t('openFlagsTotal')}
          value={loading ? '…' : openFlags}
          sub="need review"
          colorClass={openFlags > 0 ? 'text-crimson' : 'text-jade'}
        />
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-fog bg-white p-5 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="space-y-2">
                  <div className="skeleton h-5 w-56 rounded" />
                  <div className="skeleton h-3 w-40 rounded" />
                </div>
                <div className="skeleton h-10 w-16 rounded" />
              </div>
              <div className="skeleton h-2 w-full rounded-full" />
              <div className="skeleton h-2 w-full rounded-full mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Institution cards */}
      {!loading && (
        <div className="space-y-4">
          {institutions.map(inst => (
            <InstitutionCard key={inst.id} inst={inst} />
          ))}
        </div>
      )}
    </div>
  );
}
