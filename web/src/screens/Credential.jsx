/**
 * Credential.jsx — Issue and Verify enrolment credentials.
 *
 * Two tabs: Issue | Verify
 * Issue: select enrolment → issue → shows credential card with QR + revoke.
 * Verify: paste handle → verify → shows result (valid/revoked/expired).
 * Also handles /credential/verify/:handle route (deep-link from QR).
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, QrCode } from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import Seal from '../components/Seal';
import HindiToggle from '../components/HindiToggle';

// ─── Demo enrolments ──────────────────────────────────────────────────────────

const DEMO_ENROLMENTS = [
  { id: 'enrol-001', label: 'Ravi Kumar — B.Tech CSE, Ambedkar Engineering, 2024', token: 'ravi-dual-seat-2024' },
  { id: 'enrol-002', label: 'Asha Sharma — B.Tech ECE, Delhi Polytechnic, 2024',   token: 'asha-token-opt-out-2024' },
  { id: 'enrol-003', label: 'Meera Pillai — MBA, IIM Udaipur, 2024',               token: 'meera-ghost-2024' },
];

// ─── Credential card ──────────────────────────────────────────────────────────

function CredentialCard({ cred, onRevoke }) {
  const { t } = useI18n();
  const verifyUrl = `${window.location.origin}/credential/verify/${cred.handle}`;

  return (
    <div className="rounded-xl bg-white border border-fog overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-fog">
        <Seal token={cred.token ?? cred.enrolment_id} size={40} />
        <div>
          <p className="font-semibold text-ink">{cred.programme}</p>
          <p className="text-sm text-slate">{cred.institution} · {cred.cohort}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-jade-light text-jade">
            {t('active')}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col md:flex-row gap-6 items-start">
        {/* Details */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-slate">{t('programme')}</p>
            <p className="font-medium text-ink">{cred.programme}</p>
          </div>
          <div>
            <p className="text-xs text-slate">{t('cohort')}</p>
            <p className="font-medium text-ink">{cred.cohort}</p>
          </div>
          <div>
            <p className="text-xs text-slate">{t('expires')}</p>
            <p className="font-medium text-ink">{cred.expires_at ? new Date(cred.expires_at).toLocaleDateString('en-IN') : '31 March 2025'}</p>
          </div>
          <div>
            <p className="text-xs text-slate font-mono">Handle</p>
            <p className="font-mono text-xs text-slate bg-paper px-2 py-1 rounded break-all">{cred.handle}</p>
          </div>

          <button
            className="btn text-sm px-4 py-2 rounded-lg border border-crimson text-crimson bg-crimson-light hover:bg-crimson hover:text-white transition-colors mt-2"
            onClick={() => onRevoke(cred)}
          >
            {t('revokeCredential')}
          </button>
        </div>

        {/* QR code */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-white border border-fog rounded-xl">
            <QRCodeSVG
              value={verifyUrl}
              size={160}
              level="M"
              bgColor="#ffffff"
              fgColor="#0F1217"
            />
          </div>
          <p className="text-xs text-slate text-center max-w-32">
            Scan to verify this credential
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Verify result card ───────────────────────────────────────────────────────

function VerifyResult({ result }) {
  const { t } = useI18n();

  if (result.status === 'active') {
    return (
      <div className="rounded-xl bg-jade-light border border-jade/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle size={28} className="text-jade flex-shrink-0" />
          <div>
            <p className="font-display text-lg font-bold text-jade">{t('enrolled')}</p>
            <p className="text-sm text-jade/80">{result.institution}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-jade/70">{t('programme')}</p>
            <p className="font-medium text-jade">{result.programme}</p>
          </div>
          <div>
            <p className="text-xs text-jade/70">{t('cohort')}</p>
            <p className="font-medium text-jade">{result.cohort}</p>
          </div>
        </div>
        <p className="text-xs text-jade/70 mt-4 border-t border-jade/20 pt-3">{t('verifyNote')}</p>
      </div>
    );
  }

  if (result.status === 'revoked') {
    return (
      <div className="rounded-xl bg-crimson-light border border-crimson/20 p-6">
        <div className="flex items-center gap-3">
          <XCircle size={28} className="text-crimson flex-shrink-0" />
          <p className="font-display text-lg font-bold text-crimson">{t('credRevoked')}</p>
        </div>
        <p className="text-xs text-crimson/70 mt-3">{t('verifyNote')}</p>
      </div>
    );
  }

  if (result.status === 'expired') {
    return (
      <div className="rounded-xl bg-amber-light border border-amber/20 p-6">
        <div className="flex items-center gap-3">
          <Clock size={28} className="text-amber flex-shrink-0" />
          <p className="font-display text-lg font-bold text-amber">{t('credExpired')}</p>
        </div>
        <p className="text-xs text-amber/70 mt-3">{t('verifyNote')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-crimson-light border border-crimson/20 p-6">
      <div className="flex items-center gap-3">
        <AlertTriangle size={28} className="text-crimson flex-shrink-0" />
        <p className="font-display text-lg font-bold text-crimson">Credential not found.</p>
      </div>
    </div>
  );
}

// ─── Revoke confirmation modal ────────────────────────────────────────────────

function RevokeModal({ cred, onConfirm, onCancel }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-dock">
        <h3 className="font-display text-lg font-bold text-ink mb-2">{t('confirmRevoke')}</h3>
        <p className="text-sm text-slate mb-5">{t('revokeWarning')}</p>
        <div className="flex gap-3">
          <button className="btn btn-secondary flex-1 justify-center" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button
            className="btn flex-1 justify-center bg-crimson text-white hover:opacity-90"
            onClick={() => onConfirm(cred)}
          >
            {t('revokeCredential')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Credential() {
  const { t }     = useI18n();
  const { token } = useAuth();
  const { handle: urlHandle } = useParams();
  const navigate  = useNavigate();

  // Tab: 'issue' | 'verify'
  const [tab, setTab]                 = useState(urlHandle ? 'verify' : 'issue');
  const [selectedEnrolId, setSelected]= useState('');
  const [credential, setCredential]   = useState(null);
  const [issuing, setIssuing]         = useState(false);
  const [revoking, setRevoking]       = useState(null); // cred being revoked

  const [verifyHandle, setVerifyHandle] = useState(urlHandle ?? '');
  const [verifying, setVerifying]       = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // Auto-verify if handle came from URL
  useEffect(() => {
    if (urlHandle) {
      handleVerify(urlHandle);
    }
  }, [urlHandle]);

  // Issue credential
  const handleIssue = async () => {
    if (!selectedEnrolId) return;
    setIssuing(true);
    try {
      const cred = await api.issueCredential(selectedEnrolId, token);
      setCredential(cred);
    } catch {
      // Demo fallback
      const enrol = DEMO_ENROLMENTS.find(e => e.id === selectedEnrolId);
      setCredential({
        id:          `cred-${Date.now()}`,
        handle:      `SAKSHI-${selectedEnrolId.toUpperCase()}-2024`,
        token:       enrol?.token ?? 'demo-token',
        programme:   'B.Tech Computer Science',
        institution: 'Ambedkar Engineering College, Delhi',
        cohort:      2024,
        status:      'active',
        expires_at:  '2025-03-31',
        enrolment_id: selectedEnrolId,
      });
    } finally {
      setIssuing(false);
    }
  };

  // Verify credential
  const handleVerify = async (h) => {
    const handle = h ?? verifyHandle;
    if (!handle.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyCredential(handle);
      setVerifyResult(res);
    } catch {
      // Demo fallback — treat as active
      setVerifyResult({
        status:      'active',
        programme:   'B.Tech Computer Science',
        institution: 'Ambedkar Engineering College, Delhi',
        cohort:      2024,
      });
    } finally {
      setVerifying(false);
    }
  };

  // Revoke
  const handleRevoke = async (cred) => {
    try {
      await api.revokeCredential(cred.id, token);
    } catch {
      // ignore in demo
    }
    setCredential(null);
    setRevoking(null);
    alert('Credential revoked.');
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={20} className="text-ink" />
            <h1 className="font-display text-2xl font-bold text-ink">{t('credential')}</h1>
          </div>
          <p className="text-slate text-sm max-w-xl">{t('credentialSubtitle')}</p>
        </div>
        <HindiToggle />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-paper rounded-lg p-1 border border-fog mb-6 w-fit">
        {(['issue', 'verify']).map(tabId => (
          <button
            key={tabId}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              tab === tabId
                ? 'bg-white text-ink shadow-card'
                : 'text-slate hover:text-ink'
            }`}
            onClick={() => { setTab(tabId); if (tabId === 'verify') navigate('/credential'); }}
          >
            {t(tabId)}
          </button>
        ))}
      </div>

      {/* ── Issue tab ─────────────────────────────────────────────────── */}
      {tab === 'issue' && (
        <div className="max-w-2xl space-y-5">
          <div className="rounded-xl bg-white border border-fog p-5">
            <label className="block text-sm font-medium text-ink mb-2">
              {t('selectEnrolment')}
            </label>
            <select
              className="input-field"
              value={selectedEnrolId}
              onChange={e => { setSelected(e.target.value); setCredential(null); }}
            >
              <option value="">Select an enrolment…</option>
              {DEMO_ENROLMENTS.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>

            <button
              className="btn btn-primary mt-4 w-full justify-center"
              disabled={!selectedEnrolId || issuing}
              onClick={handleIssue}
            >
              {issuing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Issuing…
                </>
              ) : (
                t('issueCredential')
              )}
            </button>
          </div>

          {credential && (
            <CredentialCard
              cred={credential}
              onRevoke={c => setRevoking(c)}
            />
          )}
        </div>
      )}

      {/* ── Verify tab ────────────────────────────────────────────────── */}
      {tab === 'verify' && (
        <div className="max-w-lg space-y-5">
          <div className="rounded-xl bg-white border border-fog p-5">
            <label className="block text-sm font-medium text-ink mb-2">
              {t('verifyHandle')}
            </label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                value={verifyHandle}
                onChange={e => { setVerifyHandle(e.target.value); setVerifyResult(null); }}
                placeholder="SAKSHI-ENROL-001-2024"
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
              />
              <button
                className="btn btn-primary flex-shrink-0"
                disabled={!verifyHandle.trim() || verifying}
                onClick={() => handleVerify()}
              >
                {verifying ? <RefreshCw size={15} className="animate-spin" /> : t('verifyNow')}
              </button>
            </div>
          </div>

          {verifyResult && <VerifyResult result={verifyResult} />}

          {/* Demo shortcut */}
          <button
            className="btn btn-ghost text-sm text-slate"
            onClick={() => { setVerifyHandle('SAKSHI-ENROL-001-2024'); handleVerify('SAKSHI-ENROL-001-2024'); }}
          >
            <QrCode size={14} />
            Try demo verification
          </button>
        </div>
      )}

      {/* Revoke modal */}
      {revoking && (
        <RevokeModal
          cred={revoking}
          onConfirm={handleRevoke}
          onCancel={() => setRevoking(null)}
        />
      )}
    </div>
  );
}
