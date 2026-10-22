/**
 * CitizenWindow.jsx — The student-facing Citizen Window.
 *
 * Allows students to authenticate via a privacy-preserving OTP flow,
 * inspect every enrolment registered under their cryptographic seal,
 * see an immutable audit of verifications (who checked and why),
 * and assert their rights via "This is not me" disputes and consent withdrawal.
 */

import React, { useState, useEffect } from 'react';
import {
  Shield, CheckCircle, AlertTriangle, ArrowRight, Clock,
  Lock, Eye, UserCheck, FileWarning, LogOut, RefreshCw
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import Seal from '../components/Seal';
import StatusBadge from '../components/StatusBadge';
import HindiToggle from '../components/HindiToggle';

export default function CitizenWindow() {
  const { t } = useI18n();
  const { token, role, login, logout } = useAuth();

  // Authentication State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Records State
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsData, setRecordsData] = useState(null);
  const [fetchError, setFetchError] = useState('');

  // Dispute Modal State
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedEnrolment, setSelectedEnrolment] = useState(null);
  const [disputeType, setDisputeType] = useState('ghost_enrolment');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState('');
  const [disputesList, setDisputesList] = useState([]);

  // Consent Withdrawal State
  const [consentWithdrawn, setConsentWithdrawn] = useState(false);
  const [withdrawingConsent, setWithdrawingConsent] = useState(false);

  // Is authenticated as a student?
  const isStudent = token && role === 'student';

  useEffect(() => {
    if (isStudent) {
      loadRecords();
    }
  }, [isStudent, token]);

  const loadRecords = async () => {
    setLoadingRecords(true);
    setFetchError('');
    try {
      const data = await api.getMyRecords(token);
      setRecordsData(data);
    } catch (err) {
      setFetchError(err.message || t('error'));
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSendOtp = async (targetPhone = phone) => {
    if (!targetPhone) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      await api.studentOtp(targetPhone);
      setOtpSent(true);
      setOtp('123456'); // pre-fill demo OTP for zero-friction
    } catch (err) {
      setAuthError(err.message || 'Failed to send OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!phone || !otp) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await api.studentVerify(phone, otp);
      login(res.access_token, 'student');
      setOtpSent(false);
      setOtp('');
    } catch (err) {
      setAuthError(err.message || 'OTP verification failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePersonaLogin = (demoPhone) => {
    setPhone(demoPhone);
    handleSendOtp(demoPhone);
  };

  const openDisputeFor = (enrolment) => {
    setSelectedEnrolment(enrolment);
    setDisputeType('ghost_enrolment');
    setDisputeNotes('');
    setDisputeSuccess('');
    setDisputeModalOpen(true);
  };

  const submitDispute = async (e) => {
    e.preventDefault();
    if (!selectedEnrolment) return;
    setDisputeSubmitting(true);
    setDisputeSuccess('');
    try {
      await api.createDispute({
        institution_id: selectedEnrolment.institution_id,
        dispute_type: disputeType,
        description: disputeNotes || undefined
      }, token);

      setDisputesList((prev) => [
        {
          id: Date.now(),
          institution: selectedEnrolment.institution,
          type: disputeType,
          status: 'open',
          date: new Date().toLocaleDateString()
        },
        ...prev
      ]);
      setDisputeSuccess(t('notMe') + ' report filed successfully. AICTE has received this alert.');
      setTimeout(() => {
        setDisputeModalOpen(false);
      }, 1800);
    } catch (err) {
      setAuthError(err.message || 'Failed to submit dispute');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const handleWithdrawConsent = async () => {
    if (!window.confirm(t('withdrawNote'))) return;
    setWithdrawingConsent(true);
    try {
      await api.withdrawConsent('all', token);
      setConsentWithdrawn(true);
      await loadRecords();
    } catch (err) {
      alert(err.message || 'Could not withdraw consent');
    } finally {
      setWithdrawingConsent(false);
    }
  };

  // ── Unauthenticated / Student Login Screen ──────────────────────────────────
  if (!isStudent) {
    return (
      <div className="space-y-6">
        {/* Step 5 Explainer Banner */}
        <div className="bg-[#FFF8F0] border border-[#FDE5CC] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-crimson text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-sm">
            5
          </div>
          <div>
            <h2 className="font-display font-bold text-ink text-sm sm:text-base">
              Step 5: Student Citizen Window & Ghost Enrolment Dispute
            </h2>
            <p className="text-xs sm:text-sm text-slate mt-0.5 leading-relaxed">
              <strong>What happens here:</strong> Students authenticate via mock phone OTP (no identity stored). They see which colleges have enrolled them and who checked their records. If a college enrolled them without consent (ghost seat), clicking <strong>"This is not me"</strong> flags an immediate regulatory alert on AICTE's investigation queue.
            </p>
          </div>
        </div>

        <div className="bg-white border border-fog rounded-3xl p-6 sm:p-8 shadow-sm max-w-xl mx-auto">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-crimson-light flex items-center justify-center text-crimson">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-ink">
                  {t('citizen')}
                </h2>
                <p className="text-xs text-slate">
                  {t('step3')}
                </p>
              </div>
            </div>

            {authError && (
              <div className="mb-5 p-3 rounded-lg bg-crimson-light border border-crimson/20 text-crimson text-xs sm:text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">
                    {t('enterMobile')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543001"
                    className="w-full px-4 py-3 rounded-xl border border-fog focus:outline-none focus:border-ink font-mono text-base"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={authLoading || !phone}
                  className="w-full py-3.5 px-4 bg-ink text-white font-medium rounded-xl hover:bg-ink/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {authLoading ? t('loading') : t('sendOtp')}
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate uppercase tracking-wider">
                      {t('enterOtp')}
                    </label>
                    <span className="text-xs text-jade font-medium">OTP: 123456</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-fog focus:outline-none focus:border-ink font-mono text-center tracking-widest text-xl"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={authLoading || otp.length < 6}
                  className="w-full py-3.5 px-4 bg-ink text-white font-medium rounded-xl hover:bg-ink/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {authLoading ? t('loading') : t('verifyOtp')}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-xs text-slate hover:text-ink text-center py-1"
                >
                  {t('retry')}
                </button>
              </div>
            )}

            {/* Quick Demo Personas */}
            <div className="mt-8 pt-6 border-t border-fog">
              <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">
                {t('demoMode')} shortcuts
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handlePersonaLogin('9876543001')}
                  className="flex items-center justify-between p-3 rounded-xl bg-paper hover:bg-fog/60 transition text-left text-xs font-medium text-ink"
                >
                  <span>{t('loginAsAsha')} (Opted-out student)</span>
                  <span className="font-mono text-slate">9876543001</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePersonaLogin('9876543002')}
                  className="flex items-center justify-between p-3 rounded-xl bg-paper hover:bg-fog/60 transition text-left text-xs font-medium text-ink"
                >
                  <span>{t('loginAsRavi')} (Holds 2 seats)</span>
                  <span className="font-mono text-slate">9876543002</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePersonaLogin('9876543003')}
                  className="flex items-center justify-between p-3 rounded-xl bg-crimson-light/50 border border-crimson/20 hover:bg-crimson-light transition text-left text-xs font-medium text-crimson"
                >
                  <span>{t('loginAsMeera')} (Ghost seat victim)</span>
                  <span className="font-mono text-crimson/80">9876543003</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated Student View ──────────────────────────────────────────────
  const enrolments = recordsData?.enrolments ?? [];
  const tokenHandle = recordsData?.student_token ?? 'STUDENT-SEAL';
  const hasOptedOut = consentWithdrawn || enrolments.some(e => e.assurance_tier === 'attested');

  return (
    <div className="space-y-6">
      {/* Step 5 Explainer Banner */}
      <div className="bg-[#FFF8F0] border border-[#FDE5CC] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-crimson text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-sm">
          5
        </div>
        <div className="flex-1">
          <h2 className="font-display font-bold text-ink text-sm sm:text-base">
            Step 5: Student Citizen Window & Ghost Enrolment Dispute
          </h2>
          <p className="text-xs sm:text-sm text-slate mt-0.5 leading-relaxed">
            <strong>What happens here:</strong> You are logged in as a student using an anonymous session. Below are all enrolments registered under your seal. If any college enrolled you without permission, click <strong>"This is not me"</strong> to report a ghost enrolment to AICTE.
          </p>
        </div>
        <button
          onClick={() => { logout(); setRecordsData(null); }}
          className="px-3.5 py-1.5 rounded-xl bg-white border border-fog text-xs font-semibold text-slate hover:text-ink transition flex-shrink-0 flex items-center gap-1.5"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>

      {/* Seal & Pseudonym Banner */}
      <div className="bg-white border border-fog rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="flex-shrink-0">
          <Seal token={tokenHandle} size={96} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate">
              {t('seal')}
            </span>
            <span className="font-mono text-xs bg-paper px-2 py-0.5 rounded border border-fog text-ink">
              {tokenHandle}
            </span>
            <span className="text-xs bg-jade-light text-jade font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <UserCheck size={12} /> Privacy Protected
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-ink">
            Your Anonymous Student Identity
          </h2>
          <p className="text-sm text-slate mt-1">
            {recordsData?.note || 'AICTE and institutions never receive your raw identity or contact details. Only your cryptographic stamp is verified.'}
          </p>
        </div>
      </div>

      {/* Opt-Out / Refusal Status Banner */}
      {hasOptedOut && (
        <div className="mb-8 p-4 rounded-xl bg-jade-light/70 border border-jade/30 flex items-start gap-3">
          <Shield className="text-jade flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-ink leading-relaxed">
            <strong className="block font-semibold text-jade mb-0.5">
              Lawful APAAR Opt-Out Protected
            </strong>
            {t('optedOut')}
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loadingRecords && (
        <div className="py-16 text-center text-slate">
          <RefreshCw className="animate-spin mx-auto mb-3 text-ink" size={24} />
          <p className="text-sm">{t('loading')}</p>
        </div>
      )}

      {fetchError && (
        <div className="p-4 rounded-xl bg-crimson-light text-crimson text-sm flex items-center gap-2 mb-6">
          <AlertTriangle size={18} />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Section 1: Enrolment Records */}
      {!loadingRecords && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-ink">
              {t('myEnrolments')} ({enrolments.length})
            </h3>
            <span className="text-xs text-slate">
              Verified by AICTE Lock 2
            </span>
          </div>

          {enrolments.length === 0 ? (
            <div className="p-8 text-center bg-white border border-fog rounded-xl text-slate text-sm">
              {t('noData')}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {enrolments.map((enrol, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-fog rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate/40 transition shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <Seal token={`${tokenHandle}-${enrol.programme}`} size={48} className="flex-shrink-0 mt-1" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-display font-bold text-base text-ink">
                          {enrol.institution}
                        </span>
                        <StatusBadge status={enrol.assurance_tier} size="sm" />
                      </div>
                      <p className="text-sm text-slate">
                        {enrol.programme} · Cohort {enrol.cohort_year} · {enrol.mode} mode
                      </p>
                      <p className="text-xs text-slate/80 mt-1">
                        Enrolment status: <span className="font-medium text-ink">{enrol.status}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions for this seat */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => openDisputeFor(enrol)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-crimson-light text-crimson hover:bg-crimson hover:text-white transition flex items-center gap-1.5"
                    >
                      <FileWarning size={14} />
                      <span>{t('notMe')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Section 2: Verification Access History */}
      {!loadingRecords && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-ink">
                {t('whoChecked')}
              </h3>
              <p className="text-xs text-slate">
                {t('accessHistory')}
              </p>
            </div>
            <Eye size={18} className="text-slate" />
          </div>

          <div className="bg-white border border-fog rounded-2xl p-6 shadow-sm">
            {enrolments.flatMap(e => e.access_log || []).length === 0 ? (
              <div className="text-center py-6 text-slate text-xs sm:text-sm">
                No third-party checks recorded yet. Whenever an employer or institution scans your credential QR, it appears here.
              </div>
            ) : (
              <div className="space-y-4">
                {enrolments.flatMap(e => e.access_log || []).map((ev, i) => (
                  <div key={i} className="flex items-start justify-between py-3 border-b border-fog last:border-0 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-paper flex items-center justify-center text-slate">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-ink capitalize">
                          {ev.who} verification · {ev.why}
                        </p>
                        <p className="text-xs text-slate">
                          {new Date(ev.when).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-jade-light text-jade">
                      {ev.result}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 3: Registered Disputes */}
      {disputesList.length > 0 && (
        <section className="mb-10">
          <h3 className="font-display font-bold text-lg text-ink mb-3">
            {t('disputes')} ({disputesList.length})
          </h3>
          <div className="space-y-3">
            {disputesList.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-white border border-crimson/30 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-semibold text-ink text-sm">
                    {d.institution} — <span className="text-crimson capitalize">{d.type.replace('_', ' ')}</span>
                  </p>
                  <p className="text-xs text-slate mt-0.5">
                    Filed on {d.date} · Status: <span className="font-semibold text-amber">Under AICTE Review</span>
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-crimson-light text-crimson">
                  Flagged
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Consent & DPDP Controls */}
      <section className="bg-white border border-fog rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-lg text-ink">
              {t('consent')} & DPDP Act 2023 Controls
            </h3>
            <p className="text-xs sm:text-sm text-slate mt-1 max-w-xl">
              Under the July 2026 Supreme Court order, you hold the sovereign right to opt out of centralized APAAR ID tracking. Your admission remains 100% lawful and fully protected.
            </p>
          </div>
          <button
            type="button"
            onClick={handleWithdrawConsent}
            disabled={withdrawingConsent || hasOptedOut}
            className={`px-4 py-2.5 text-xs font-semibold rounded-xl border transition ${
              hasOptedOut
                ? 'bg-fog text-slate border-fog cursor-not-allowed'
                : 'bg-white text-ink border-fog hover:border-ink'
            }`}
          >
            {hasOptedOut ? 'Consent Withdrawn (Attested)' : t('withdraw')}
          </button>
        </div>
      </section>

      {/* "This is not me" Dispute Modal */}
      {disputeModalOpen && selectedEnrolment && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-fog rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-crimson-light flex items-center justify-center text-crimson">
                <FileWarning size={20} />
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-ink">
                  {t('notMe')}
                </h4>
                <p className="text-xs text-slate">
                  Report ghost enrolment or identity misuse
                </p>
              </div>
            </div>

            {disputeSuccess ? (
              <div className="py-8 text-center text-jade font-semibold text-sm">
                <CheckCircle size={36} className="mx-auto mb-2 text-jade" />
                {disputeSuccess}
              </div>
            ) : (
              <form onSubmit={submitDispute} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">
                    {t('disputeInstitution')}
                  </label>
                  <p className="font-display font-bold text-ink text-sm bg-paper p-3 rounded-lg border border-fog">
                    {selectedEnrolment.institution}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">
                    Dispute Reason
                  </label>
                  <select
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-fog text-sm focus:outline-none focus:border-ink"
                  >
                    <option value="ghost_enrolment">Ghost enrolment — I never attended or enrolled here</option>
                    <option value="wrong_programme">Wrong programme or seat category declared</option>
                    <option value="wrong_year">Incorrect academic cohort year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">
                    {t('disputeDetails')} (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    placeholder="Provide any details for AICTE investigators..."
                    className="w-full px-3 py-2 rounded-lg border border-fog text-sm focus:outline-none focus:border-ink resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setDisputeModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate hover:text-ink"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={disputeSubmitting}
                    className="px-5 py-2.5 text-xs font-semibold bg-crimson text-white rounded-xl hover:bg-crimson/90 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {disputeSubmitting ? t('loading') : t('submitDispute')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

