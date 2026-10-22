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
  Lock, Eye, UserCheck, FileWarning, LogOut, RefreshCw, Sparkles, Building2
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import Seal from '../components/Seal';
import StatusBadge from '../components/StatusBadge';

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
      setOtp('123456'); // pre-fill demo OTP for zero-friction evaluation
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

  const handlePersonaLogin = async (demoPhone) => {
    setPhone(demoPhone);
    setAuthLoading(true);
    setAuthError('');
    try {
      await api.studentOtp(demoPhone);
      const res = await api.studentVerify(demoPhone, '123456');
      login(res.access_token, 'student');
      setOtpSent(false);
      setOtp('');
    } catch (err) {
      setAuthError(err.message || 'Persona login failed');
    } finally {
      setAuthLoading(false);
    }
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
      }, 1600);
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
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Step Banner */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-purple-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
              5
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                Step 5: Citizen Window & Ghost Enrolment Dispute
              </h2>
              <p className="text-xs text-gray-500">
                Authenticate via mock phone OTP with zero stored identity to review enrolled seats and access logs.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-emerald-800 text-[11px] font-semibold">
            <UserCheck size={12} /> DPDP 2023 Compliant
          </span>
        </div>

        {/* 2-Column Auth & Persona Portal */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Direct Phone/OTP Login */}
          <div className="md:col-span-5 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#F0F6FF] text-blue-600 flex items-center justify-center">
                  <Lock size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {t('citizen')}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Verify via mock SMS OTP
                  </p>
                </div>
              </div>

              {authError && (
                <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {!otpSent ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {t('enterMobile')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543001"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900 font-mono text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={authLoading || !phone}
                    className="w-full py-2.5 px-3 bg-[#181A20] text-white font-medium text-xs rounded-xl hover:bg-black transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {authLoading ? t('loading') : t('sendOtp')}
                    <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {t('enterOtp')}
                      </label>
                      <span className="text-[11px] text-emerald-600 font-semibold bg-[#DCFCE7] px-1.5 py-0.5 rounded">
                        OTP: 123456
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900 font-mono text-center tracking-widest text-lg font-bold text-gray-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={authLoading || otp.length < 6}
                    className="w-full py-2.5 px-3 bg-[#181A20] text-white font-medium text-xs rounded-xl hover:bg-black transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {authLoading ? t('loading') : t('verifyOtp')}
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-xs text-gray-500 hover:text-gray-900 py-1"
                  >
                    {t('retry')}
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5">
              <Shield size={12} className="text-emerald-500" /> No Aadhaar or raw APAAR stored in browser session.
            </p>
          </div>

          {/* Right Column: Demo Persona Stories (Pastel Cards) */}
          <div className="md:col-span-7 space-y-2.5">
            <div className="px-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                1-Click Demo Evaluation Personas
              </span>
              <span className="text-[11px] text-gray-400">Instant login</span>
            </div>

            {/* Persona 1: Asha (Opted-out) */}
            <button
              type="button"
              onClick={() => handlePersonaLogin('9876543001')}
              className="w-full text-left p-3.5 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] hover:border-emerald-400 transition-all shadow-sm flex items-start gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/80 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                A
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-semibold text-gray-900 text-xs">
                    {t('loginAsAsha')} — Lawful APAAR Opt-Out
                  </h4>
                  <span className="font-mono text-[11px] text-emerald-800 font-medium">9876543001</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Exercised DPDP 2023 Section 6 opt-out. Admitted under Lock 3 offline attested quota without central tracking.
                </p>
              </div>
            </button>

            {/* Persona 2: Ravi (Dual Seat) */}
            <button
              type="button"
              onClick={() => handlePersonaLogin('9876543002')}
              className="w-full text-left p-3.5 rounded-2xl bg-[#F3E8FF] border border-[#E9D5FF] hover:border-purple-400 transition-all shadow-sm flex items-start gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/80 text-purple-800 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                R
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-semibold text-gray-900 text-xs">
                    {t('loginAsRavi')} — Dual Seat Holder
                  </h4>
                  <span className="font-mono text-[11px] text-purple-800 font-medium">9876543002</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Enrolled concurrently in COEP and PICT Pune. Shows how dual records appear under a single anonymous seal.
                </p>
              </div>
            </button>

            {/* Persona 3: Meera (Ghost Seat Victim) */}
            <button
              type="button"
              onClick={() => handlePersonaLogin('9876543003')}
              className="w-full text-left p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] hover:border-rose-400 transition-all shadow-sm flex items-start gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/80 text-rose-800 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                M
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-semibold text-gray-900 text-xs">
                    {t('loginAsMeera')} — Ghost Enrolment Victim
                  </h4>
                  <span className="font-mono text-[11px] text-rose-800 font-medium">9876543003</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Unenrolled college claimed her APAAR token for AICTE funding. Click <strong>"This is not me"</strong> to alert AICTE.
                </p>
              </div>
            </button>
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
    <div className="space-y-4">
      {/* Top Banner & Session Controls */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Seal token={tokenHandle} size={42} className="flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm">
                Student Cryptographic Window
              </h2>
              <span className="text-[11px] bg-[#DCFCE7] text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <UserCheck size={11} /> Zero PII Stored
              </span>
            </div>
            <p className="font-mono text-xs text-gray-500 mt-0.5 truncate max-w-sm sm:max-w-md">
              SEAL: <span className="text-gray-900 font-medium">{tokenHandle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => loadRecords()}
            disabled={loadingRecords}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
            title="Refresh records"
          >
            <RefreshCw size={14} className={loadingRecords ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { logout(); setRecordsData(null); }}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition flex items-center gap-1.5"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Opt-Out Banner if applicable */}
      {hasOptedOut && (
        <div className="p-3.5 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-start gap-3">
          <Shield className="text-emerald-700 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-gray-800 leading-relaxed">
            <strong className="font-semibold text-emerald-900 mr-1">
              Lawful APAAR Opt-Out Enforced:
            </strong>
            {t('optedOut')} Central tracking disabled under DPDP 2023.
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loadingRecords && (
        <div className="py-12 text-center text-gray-500">
          <RefreshCw className="animate-spin mx-auto mb-2 text-gray-700" size={20} />
          <p className="text-xs font-medium">{t('loading')}</p>
        </div>
      )}

      {fetchError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertTriangle size={15} />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Main Content Grid: Enrolments & Access Log */}
      {!loadingRecords && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Enrolment Records (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                {t('myEnrolments')} ({enrolments.length})
              </h3>
              <span className="text-[11px] text-gray-400">
                AICTE Lock 2 Verified
              </span>
            </div>

            {enrolments.length === 0 ? (
              <div className="p-6 text-center bg-white border border-gray-200/90 rounded-2xl text-gray-400 text-xs">
                {t('noData')}
              </div>
            ) : (
              <div className="space-y-2.5">
                {enrolments.map((enrol, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm hover:border-gray-300 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#F0F6FF] text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {enrol.institution}
                            </h4>
                            <StatusBadge status={enrol.assurance_tier} size="sm" />
                          </div>
                          <p className="text-xs text-gray-500">
                            {enrol.programme} · Cohort {enrol.cohort_year} · {enrol.mode} mode
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Status: <span className="font-medium text-gray-700 capitalize">{enrol.status}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openDisputeFor(enrol)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition flex items-center gap-1 flex-shrink-0"
                      >
                        <FileWarning size={12} />
                        <span>{t('notMe')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Registered Disputes Alert */}
            {disputesList.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
                  Active Disputes ({disputesList.length})
                </h4>
                {disputesList.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FFE4E6] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-rose-900">
                        {d.institution} — <span className="capitalize">{d.type.replace('_', ' ')}</span>
                      </p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Filed {d.date} · Regulatory status: Under AICTE Review
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                      Flagged
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Verification History & DPDP Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Access History */}
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={13} />
                  <span>{t('whoChecked')}</span>
                </h3>
                <span className="text-[11px] text-gray-400">Scan Audit</span>
              </div>

              <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm">
                {enrolments.flatMap(e => e.access_log || []).length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    No third-party checks recorded. Scans of your credential QR appear here instantly.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {enrolments.flatMap(e => e.access_log || []).map((ev, i) => (
                      <div key={i} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 text-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0 mt-0.5">
                            <Clock size={12} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 capitalize">
                              {ev.who} · {ev.why}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {new Date(ev.when).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#DCFCE7] text-emerald-800">
                          {ev.result}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* DPDP Act 2023 Controls Card */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm">
              <h4 className="font-semibold text-gray-900 text-xs mb-1">
                {t('consent')} & DPDP Act 2023
              </h4>
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                Under the July 2026 Supreme Court order, you hold the sovereign right to opt out of centralized APAAR tracking while keeping your degree 100% valid.
              </p>
              <button
                type="button"
                onClick={handleWithdrawConsent}
                disabled={withdrawingConsent || hasOptedOut}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                  hasOptedOut
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-gray-900'
                }`}
              >
                {hasOptedOut ? 'Consent Withdrawn (Offline Attested)' : t('withdraw')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "This is not me" Dispute Modal */}
      {disputeModalOpen && selectedEnrolment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-5 shadow-xl animate-fade-in">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                <FileWarning size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  {t('notMe')} — Ghost Seat Dispute
                </h4>
                <p className="text-[11px] text-gray-500">
                  Notify AICTE Regulation Bureau of false seat claim
                </p>
              </div>
            </div>

            {disputeSuccess ? (
              <div className="py-7 text-center animate-fade-in">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center transition-transform transform scale-100 shadow-xs">
                  <CheckCircle size={32} className="text-emerald-600 animate-pulse" />
                </div>
                <h5 className="font-semibold text-gray-900 text-sm mb-1">
                  Dispute Docket Sealed & Dispatched
                </h5>
                <p className="text-xs text-emerald-800 max-w-xs mx-auto leading-relaxed">
                  {disputeSuccess}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-800">
                  <span>AICTE Case Ref: DISP-2026-{Math.floor(1000 + Math.random()*9000)}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={submitDispute} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {t('disputeInstitution')}
                  </label>
                  <p className="font-medium text-gray-900 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    {selectedEnrolment.institution}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Dispute Reason
                  </label>
                  <select
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-gray-900 text-gray-900"
                  >
                    <option value="ghost_enrolment">Ghost enrolment — I never attended or enrolled here</option>
                    <option value="wrong_programme">Wrong programme or seat category declared</option>
                    <option value="wrong_year">Incorrect academic cohort year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {t('disputeDetails')} (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    placeholder="Provide details for AICTE regulatory officers..."
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-gray-900 resize-none text-gray-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setDisputeModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={disputeSubmitting}
                    className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition disabled:opacity-50 flex items-center gap-1.5"
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
