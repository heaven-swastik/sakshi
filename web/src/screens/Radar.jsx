/**
 * Radar.jsx — Duplicate Radar screen.
 *
 * Shows flags where the same student seal appears in 2+ institutions.
 * No names — only seals, college names, programme, cohort, severity.
 * Filter bar: state | programme | severity.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, RefreshCw, RadioTower } from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import Seal from '../components/Seal';
import HindiToggle from '../components/HindiToggle';

// ─── Seeded demo duplicates ───────────────────────────────────────────────────

const DEMO_DUPLICATES = [
  {
    id: 'dup-001',
    token: 'ravi-dual-seat-2024',
    severity: 'HIGH',
    rule: 'R1 — Cross-institution duplicate',
    explanation: 'The same enrolment seal appears in two institutions in the same academic year. This may indicate a student holding two government-funded seats simultaneously.',
    appearances: [
      { institution: 'Ambedkar Engineering College, Delhi', programme: 'B.Tech CSE', cohort: 2024, state: 'Delhi' },
      { institution: 'Delhi Polytechnic Institute', programme: 'B.Tech IT', cohort: 2024, state: 'Delhi' },
    ],
    case_id: 'CASE-2024-1892',
    case_status: 'Open',
  },
  {
    id: 'dup-002',
    token: 'cross-state-2024',
    severity: 'HIGH',
    rule: 'R1 — Cross-institution duplicate',
    explanation: 'Same seal appears in two states. Possible state-quota misuse or data entry error.',
    appearances: [
      { institution: 'Government College of Engineering, Pune', programme: 'B.Tech Mech', cohort: 2024, state: 'Maharashtra' },
      { institution: 'NIT Jamshedpur', programme: 'B.Tech Mech', cohort: 2024, state: 'Jharkhand' },
    ],
    case_id: null,
    case_status: null,
  },
  {
    id: 'dup-003',
    token: 'mba-dup-2024',
    severity: 'MEDIUM',
    rule: 'R1 — Cross-institution duplicate',
    explanation: 'Same seal appears in two MBA programmes. Student may have enrolled in two management colleges.',
    appearances: [
      { institution: 'IIM Udaipur', programme: 'MBA', cohort: 2024, state: 'Rajasthan' },
      { institution: 'XLRI Delhi Campus', programme: 'MBA', cohort: 2024, state: 'Delhi' },
    ],
    case_id: null,
    case_status: null,
  },
];

// ─── Severity badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const colorMap = {
    HIGH:   'bg-crimson-light text-crimson',
    MEDIUM: 'bg-amber-light text-amber',
    LOW:    'bg-fog text-slate',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full tracking-wide ${colorMap[severity] ?? colorMap.LOW}`}>
      {severity}
    </span>
  );
}

// ─── Duplicate card ───────────────────────────────────────────────────────────

function DuplicateCard({ dup, onOpenCase, onAskColleges }) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl bg-white border border-fog p-6 flex flex-col gap-5">
      {/* Seal hero + severity */}
      <div className="flex flex-col items-center gap-3">
        <Seal token={dup.token} size={96} />
        <div className="flex items-center gap-2">
          <SeverityBadge severity={dup.severity} />
          <span className="text-xs text-slate font-mono">{dup.rule}</span>
        </div>
      </div>

      {/* Appears in */}
      <div>
        <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">
          {t('sealAppears')}
        </p>
        <div className="flex flex-col gap-2">
          {dup.appearances.map((a, i) => (
            <div key={i} className="flex items-start gap-2 bg-paper rounded-lg px-3 py-2.5">
              <div className="w-5 h-5 rounded-full bg-fog flex items-center justify-center text-xs font-bold text-slate flex-shrink-0 mt-0.5">
                {String.fromCharCode(65 + i)}
              </div>
              <div>
                <p className="text-sm font-medium text-ink leading-snug">{a.institution}</p>
                <p className="text-xs text-slate mt-0.5">{a.programme} · {a.cohort} · {a.state}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-slate leading-relaxed border-l-2 border-fog pl-3">
        {dup.explanation}
      </p>

      {/* Case status */}
      {dup.case_id && (
        <div className="flex items-center gap-2 text-xs text-slate bg-amber-light rounded-lg px-3 py-2">
          <AlertTriangle size={13} className="text-amber flex-shrink-0" />
          {t('caseStatus')}: <span className="font-medium text-ink">{dup.case_status}</span>
          <span className="text-slate/60 ml-auto font-mono">{dup.case_id}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          className="btn btn-primary flex-1 justify-center text-sm"
          onClick={() => onOpenCase(dup)}
        >
          {t('openCase')}
        </button>
        <button
          className="btn btn-secondary flex-1 justify-center text-sm"
          onClick={() => onAskColleges(dup)}
        >
          {t('askColleges')}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Radar() {
  const { t }     = useI18n();
  const { token } = useAuth();

  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ state: '', programme: '', severity: '' });
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const year = new Date().getFullYear();
    api.getRadar(year, token)
      .then(data => {
        setDuplicates(data?.duplicates ?? DEMO_DUPLICATES);
        setLoading(false);
      })
      .catch(() => {
        setDuplicates(DEMO_DUPLICATES);
        setLoading(false);
      });
  }, [token]);

  // Apply filters
  const filtered = duplicates.filter(d => {
    const states     = d.appearances.map(a => a.state.toLowerCase());
    const programmes = d.appearances.map(a => a.programme.toLowerCase());

    if (filters.severity   && d.severity !== filters.severity) return false;
    if (filters.state      && !states.some(s => s.includes(filters.state.toLowerCase()))) return false;
    if (filters.programme  && !programmes.some(p => p.includes(filters.programme.toLowerCase()))) return false;
    return true;
  });

  const handleOpenCase   = (dup) => alert(`Opening case for seal ${dup.token.slice(0, 12)}… (would open case management UI)`);
  const handleAskColleges= (dup) => alert(`Sending notice to ${dup.appearances.map(a => a.institution).join(' and ')}…`);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RadioTower size={20} className="text-crimson" />
            <h1 className="font-display text-2xl font-bold text-ink">{t('radar')}</h1>
          </div>
          <p className="text-slate text-sm max-w-xl">{t('radarSubtitle')}</p>
        </div>
        <HindiToggle />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          className={`btn btn-secondary text-sm ${filterOpen ? 'border-ink' : ''}`}
          onClick={() => setFilterOpen(o => !o)}
        >
          <Filter size={14} />
          {t('radarFilter')}
        </button>

        {filterOpen && (
          <>
            <input
              className="input-field w-36 text-sm py-2"
              placeholder={t('filterState')}
              value={filters.state}
              onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}
            />
            <input
              className="input-field w-40 text-sm py-2"
              placeholder={t('filterProg')}
              value={filters.programme}
              onChange={e => setFilters(f => ({ ...f, programme: e.target.value }))}
            />
            <select
              className="input-field w-36 text-sm py-2"
              value={filters.severity}
              onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
            >
              <option value="">{t('filterSeverity')}</option>
              <option value="HIGH">{t('high')}</option>
              <option value="MEDIUM">{t('medium')}</option>
              <option value="LOW">{t('low')}</option>
            </select>
            <button
              className="btn btn-ghost text-sm"
              onClick={() => setFilters({ state: '', programme: '', severity: '' })}
            >
              <RefreshCw size={13} />
              Clear
            </button>
          </>
        )}

        <span className="ml-auto text-xs text-slate">
          {filtered.length} duplicate{filtered.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-fog bg-white p-6 animate-pulse">
              <div className="w-24 h-24 skeleton rounded-full mx-auto mb-4" />
              <div className="skeleton h-4 w-24 rounded mx-auto mb-2" />
              <div className="skeleton h-3 w-full rounded mb-1" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-fog bg-white py-20 text-center">
          <RadioTower size={40} className="mx-auto text-fog mb-4" />
          <p className="text-ink font-semibold">{t('radarEmpty')}</p>
        </div>
      )}

      {/* Duplicate cards grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(dup => (
            <DuplicateCard
              key={dup.id}
              dup={dup}
              onOpenCase={handleOpenCase}
              onAskColleges={handleAskColleges}
            />
          ))}
        </div>
      )}
    </div>
  );
}
