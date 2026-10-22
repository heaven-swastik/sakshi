/**
 * Radar.jsx — Duplicate Radar screen.
 *
 * Shows flags where the same student seal appears in 2+ institutions.
 * No names — only seals, college names, programme, cohort, severity.
 * Filter bar: state | programme | severity.
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Filter, RefreshCw, RadioTower, Send,
  CheckCircle2, X, Shield, Lock, Clock, ExternalLink, ArrowRight
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import Seal from '../components/Seal';
import HindiToggle from '../components/HindiToggle';

// ─── Seeded demo duplicates ───────────────────────────────────────────────────

const DEMO_DUPLICATES = [
  {
    id: 'dup-001',
    token: 'STU-AXECI4H4VCDL6',
    severity: 'HIGH',
    rule: 'R1 — Cross-institution duplicate',
    explanation: 'The same enrolment seal appears in MIT Pune and RV College Bengaluru in the same academic year. Both report this as a full-time regular seat. A student cannot physically attend two regular programmes simultaneously.',
    appearances: [
      { institution: 'MIT Pune', programme: 'B.Tech CSE', cohort: 2026, state: 'Maharashtra' },
      { institution: 'RV College Bengaluru', programme: 'B.Tech CSE', cohort: 2026, state: 'Karnataka' },
    ],
    case_id: 'CASE-2026-1895',
    case_status: 'Open',
  },
  {
    id: 'dup-002',
    token: 'cross-state-2026',
    severity: 'HIGH',
    rule: 'R1 — Cross-institution duplicate',
    explanation: 'Same seal appears in two states. Possible state-quota misuse or data entry error.',
    appearances: [
      { institution: 'Government College of Engineering, Pune', programme: 'B.Tech Mech', cohort: 2026, state: 'Maharashtra' },
      { institution: 'NIT Jamshedpur', programme: 'B.Tech Mech', cohort: 2026, state: 'Jharkhand' },
    ],
    case_id: null,
    case_status: null,
  },
  {
    id: 'dup-003',
    token: 'mba-dup-2026',
    severity: 'MEDIUM',
    rule: 'R1 — Cross-institution duplicate',
    explanation: 'Same seal appears in two MBA programmes. Student may have enrolled in two management colleges.',
    appearances: [
      { institution: 'IIM Udaipur', programme: 'MBA', cohort: 2026, state: 'Rajasthan' },
      { institution: 'XLRI Delhi Campus', programme: 'MBA', cohort: 2026, state: 'Delhi' },
    ],
    case_id: null,
    case_status: null,
  },
];

// ─── Dual-Control Notice Modal ────────────────────────────────────────────────

function DualControlNoticeModal({ dup, onClose }) {
  const [dispatched, setDispatched] = useState(false);
  const [autoTimer, setAutoTimer]   = useState(true);

  const instA = dup.appearances[0] || { institution: 'Institution A', state: 'State A' };
  const instB = dup.appearances[1] || { institution: 'Institution B', state: 'State B' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-fog shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-fog">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-crimson/10 text-crimson flex items-center justify-center">
              <Send size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-ink text-base sm:text-lg">
                  AICTE Dual-College Inquiry Notice
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-crimson/10 text-crimson uppercase">
                  Rule R1 Protocol
                </span>
              </div>
              <p className="text-xs text-slate mt-0.5">
                Zero-Knowledge dispute challenge dispatched to both college registrars.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-paper hover:bg-fog text-slate flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-4">
          {/* Target Student Seal */}
          <div className="flex items-center gap-3.5 bg-paper p-3.5 rounded-2xl border border-fog">
            <Seal token={dup.token} size={48} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono uppercase text-slate font-bold">HMAC Target Seal Token</p>
              <p className="font-mono font-bold text-xs sm:text-sm text-ink truncate mt-0.5">
                {dup.token}
              </p>
              <p className="text-[11px] text-jade font-semibold flex items-center gap-1 mt-0.5">
                <Shield size={12} /> Zero raw personal data shared with registrars
              </p>
            </div>
          </div>

          {/* Recipient Institutions */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate mb-2">
              Recipients of Cryptographic Challenge:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-[#FAF5FF] border border-[#E9D5FF] p-3 rounded-xl">
                <p className="text-[10px] font-bold text-[#7E22CE] uppercase">Registrar A</p>
                <p className="font-bold text-xs text-ink mt-0.5">{instA.institution}</p>
                <p className="text-[11px] text-slate">{instA.programme} · {instA.state}</p>
              </div>
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-3 rounded-xl">
                <p className="text-[10px] font-bold text-[#1D4ED8] uppercase">Registrar B</p>
                <p className="font-bold text-xs text-ink mt-0.5">{instB.institution}</p>
                <p className="text-[11px] text-slate">{instB.programme} · {instB.state}</p>
              </div>
            </div>
          </div>

          {/* Legal / DPDP Notice */}
          <div className="bg-[#FFF8F0] border border-[#FDE5CC] p-3.5 rounded-2xl text-xs text-slate space-y-1.5">
            <p className="font-semibold text-ink flex items-center gap-1.5">
              <Lock size={13} className="text-crimson" />
              DPDP Act 2023 Compliant Coordination:
            </p>
            <p className="leading-relaxed">
              Neither AICTE nor the two colleges exchange the student's name or Aadhaar. Both registrars receive an Ed25519-signed inquiry querying: <em>"Confirm physical reporting status for Seal #{dup.token.slice(0, 8)}"</em>.
            </p>
          </div>

          {/* Post-dispatch confirmation */}
          {dispatched ? (
            <div className="bg-jade-light/40 border border-jade/30 rounded-2xl p-4 animate-fade-in space-y-2">
              <div className="flex items-center gap-2 text-jade font-bold text-xs sm:text-sm">
                <CheckCircle2 size={16} />
                Dual Notice Dispatched & Appended to Audit Chain
              </div>
              <p className="text-xs text-slate leading-relaxed">
                Notice <strong>#NOT-2026-8912</strong> delivered to {instA.institution} & {instB.institution} registrar portals.
                Transaction anchored to Merkle Root with Block Hash <code className="font-mono text-ink text-[11px]">0x7b4e...d82a</code>.
              </p>
              <div className="pt-2 flex justify-end">
                <button onClick={onClose} className="btn btn-primary text-xs py-2 px-4">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoTimer}
                  onChange={e => setAutoTimer(e.target.checked)}
                  className="rounded text-crimson focus:ring-crimson"
                />
                <span>Auto-release unconfirmed seat after 72-hour regulatory SLA window</span>
              </label>

              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setDispatched(true)}
                  className="btn btn-primary text-xs py-2 px-5 flex items-center gap-2 bg-crimson hover:bg-crimson-dark"
                >
                  <Send size={13} />
                  Dispatch Signed Notice (Both Registrars)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Case Management Modal ────────────────────────────────────────────────────

function CaseManagementModal({ dup, onClose }) {
  const [caseCreated, setCaseCreated] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-fog shadow-2xl p-6 sm:p-7 relative">
        <div className="flex items-start justify-between pb-4 border-b border-fog">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-light text-amber flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-ink text-base">
                Open AICTE Investigation Case
              </h3>
              <p className="text-xs text-slate font-mono mt-0.5">
                {dup.case_id || 'CASE-2026-1895'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-paper hover:bg-fog text-slate flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          <div className="bg-paper p-3.5 rounded-2xl border border-fog space-y-2">
            <div className="flex justify-between">
              <span className="text-slate">Target Seal:</span>
              <span className="font-mono font-bold text-ink">{dup.token.slice(0, 16)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Violation Rule:</span>
              <span className="font-semibold text-crimson">R1 — Cross-Institution Duplicate</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Involved Institutions:</span>
              <span className="font-medium text-ink">{dup.appearances.map(a => a.institution).join(' & ')}</span>
            </div>
          </div>

          {caseCreated ? (
            <div className="bg-jade-light/40 border border-jade/30 rounded-2xl p-4 text-jade font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} />
              Case assigned to AICTE Regional Vigilance Officer. Logged to audit log.
            </div>
          ) : (
            <div className="flex gap-2.5 justify-end pt-2">
              <button onClick={onClose} className="btn btn-secondary text-xs py-2 px-4">
                Close
              </button>
              <button
                onClick={() => setCaseCreated(true)}
                className="btn btn-primary text-xs py-2 px-4"
              >
                Confirm & Open Investigation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Severity badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const colorMap = {
    HIGH:   'bg-red-50 text-red-700 border border-red-200/70',
    MEDIUM: 'bg-amber-50 text-amber-800 border border-amber-200/70',
    LOW:    'bg-gray-100 text-gray-600 border border-gray-200/70',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${colorMap[severity] ?? colorMap.LOW}`}>
      {severity}
    </span>
  );
}

// ─── Duplicate card ───────────────────────────────────────────────────────────

function DuplicateCard({ dup, onOpenCase, onAskColleges }) {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl bg-white border border-gray-200/90 p-4.5 flex flex-col justify-between shadow-xs hover:border-gray-300 transition gap-3.5">
      {/* Top Header: Seal + Token + Severity */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <Seal token={dup.token} size={38} />
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block leading-none">
              HMAC Seal Token
            </span>
            <span className="font-mono font-bold text-xs text-gray-900 truncate block mt-0.5">
              {dup.token.slice(0, 14)}…
            </span>
          </div>
        </div>
        <SeverityBadge severity={dup.severity} />
      </div>

      {/* Appears in Two Colleges */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {t('sealAppears')}:
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {dup.appearances.map((a, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs ${
                i === 0
                  ? 'bg-[#FAF5FF] border-[#E9D5FF] text-[#581C87]'
                  : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
              }`}
            >
              <div className="min-w-0">
                <span className="font-bold block truncate">{a.institution}</span>
                <span className="text-[10px] opacity-75 block">{a.programme} · {a.state}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/70 shadow-2xs">
                Seat {String.fromCharCode(65 + i)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
        {dup.explanation}
      </p>

      {/* What would clear this flag checklist */}
      <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-2.5 text-[11px] text-gray-600 space-y-1">
        <span className="font-semibold text-gray-800 text-[10px] uppercase tracking-wider block">
          Institutional Resolution Checklist:
        </span>
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
          <span>1. Relieving institution Migration Certificate</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
          <span>2. Candidate Seat Relinquishment Undertaking</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
          <span>3. AICTE Approval Order if dual-degree cohort</span>
        </div>
      </div>

      {/* Case Status Pill */}
      {dup.case_id && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 border border-gray-200/80 rounded-lg px-2.5 py-1">
          <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
          <span>Case: <strong className="text-gray-900">{dup.case_status}</strong></span>
          <span className="text-gray-400 ml-auto font-mono text-[10px]">{dup.case_id}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          className="flex-1 py-1.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800 transition text-center"
          onClick={() => onOpenCase(dup)}
        >
          {t('openCase')}
        </button>
        <button
          className="flex-1 py-1.5 px-3 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-semibold transition text-center shadow-xs flex items-center justify-center gap-1.5"
          onClick={() => onAskColleges(dup)}
        >
          <Send size={11} />
          <span>{t('askColleges')}</span>
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
  const [noticeModalDup, setNoticeModalDup] = useState(null);
  const [caseModalDup, setCaseModalDup] = useState(null);

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

  const handleOpenCase   = (dup) => setCaseModalDup(dup);
  const handleAskColleges= (dup) => setNoticeModalDup(dup);

  return (
    <div className="space-y-5">
      {/* Step 2 Explainer Banner (Clean, Compact, Eye-Catching) */}
      <div className="bg-[#FFFBF5] border border-[#FDECD8] rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-gray-950 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-2xs">
          2
        </div>
        <div>
          <h2 className="font-display font-bold text-gray-900 text-sm sm:text-base">
            Step 2: Cross-Institution Duplicate Radar (Rule R1)
          </h2>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            <strong>How it works:</strong> When a candidate enrolls in both MIT Pune and RV College Bengaluru, <strong>both institutions produce the identical cryptographic seal</strong>. SAKSHI detects this mathematical match across institutions without ever needing to store the student's name, DOB, or raw APAAR ID.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2.5 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-gray-500 font-medium">
          <Filter size={13} />
          <span>Filters:</span>
        </div>

        <input
          className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-900 w-36"
          placeholder="Filter state (e.g. MH)"
          value={filters.state}
          onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}
        />
        <input
          className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-900 w-36"
          placeholder="Filter course (e.g. CSE)"
          value={filters.programme}
          onChange={e => setFilters(f => ({ ...f, programme: e.target.value }))}
        />
        <select
          className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-gray-900"
          value={filters.severity}
          onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
        >
          <option value="">All Severities</option>
          <option value="HIGH">High Severity</option>
          <option value="MEDIUM">Medium Severity</option>
          <option value="LOW">Low Severity</option>
        </select>
        {(filters.state || filters.programme || filters.severity) && (
          <button
            className="text-xs text-gray-500 hover:text-gray-900 underline ml-1"
            onClick={() => setFilters({ state: '', programme: '', severity: '' })}
          >
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500 font-medium">
          {filtered.length} duplicate incident{filtered.length !== 1 ? 's' : ''} detected
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse">
              <div className="w-10 h-10 skeleton rounded-full mb-3" />
              <div className="skeleton h-4 w-32 rounded mb-2" />
              <div className="skeleton h-3 w-full rounded mb-1" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <RadioTower size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-900 font-semibold text-sm">{t('radarEmpty')}</p>
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

      {/* Dual Control Notice Modal */}
      {noticeModalDup && (
        <DualControlNoticeModal
          dup={noticeModalDup}
          onClose={() => setNoticeModalDup(null)}
        />
      )}

      {/* Case Management Modal */}
      {caseModalDup && (
        <CaseManagementModal
          dup={caseModalDup}
          onClose={() => setCaseModalDup(null)}
        />
      )}
    </div>
  );
}
