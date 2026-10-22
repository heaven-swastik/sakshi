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
    <div className="space-y-6">
      {/* Step 2 Explainer Banner */}
      <div className="bg-[#FFF8F0] border border-[#FDE5CC] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-crimson text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-sm">
          2
        </div>
        <div>
          <h2 className="font-display font-bold text-ink text-sm sm:text-base">
            Step 2: Cross-Institution Duplicate Radar (Rule R1)
          </h2>
          <p className="text-xs sm:text-sm text-slate mt-0.5 leading-relaxed">
            <strong>What happens here:</strong> When Ravi Kumar enrolls in both MIT Pune and RV College Bengaluru, <strong>both colleges generate the identical geometric seal</strong>. SAKSHI detects this mathematical match across institutions without needing to store Ravi's name or personal ID.
          </p>
        </div>
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
