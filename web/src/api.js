/**
 * api.js — Centralised API client for SAKSHI.
 *
 * All fetch calls live here. Base URL: VITE_API_URL env var (default http://localhost:8000).
 * Every call returns the parsed JSON body (or throws on error).
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ─── Internal helper ─────────────────────────────────────────────────────────

async function request(method, path, { body, token, isFormData } = {}) {
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      errMsg = err.detail ?? err.message ?? errMsg;
    } catch {
      // ignore parse errors
    }
    throw new Error(errMsg);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

const get  = (path, opts) => request('GET',    path, opts);
const post = (path, opts) => request('POST',   path, opts);
const del  = (path, opts) => request('DELETE', path, opts);

// ─── API surface ─────────────────────────────────────────────────────────────

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  /** Quick demo login: returns { access_token, role, token_type } */
  demoLogin: (role, institutionId = null) =>
    post('/v1/auth/demo-login', {
      body: {
        role,
        actor_id: `${role}-demo-user`,
        institution_id: institutionId
      }
    }),

  /** Send OTP to a student's registered mobile */
  studentOtp: (phone) =>
    post('/v1/student/auth/otp', { body: { phone } }),

  /** Verify OTP and get student JWT */
  studentVerify: (phone, otp) =>
    post('/v1/student/auth/verify', { body: { phone, otp } }),

  // ── Batches ───────────────────────────────────────────────────────────────

  /** Upload a CSV file. Returns batch metadata and accepted count */
  uploadBatch: (file, token) => {
    const fd = new FormData();
    fd.append('file', file);
    return post('/v1/batches', { body: fd, token, isFormData: true });
  },

  /** Fetch row-level batch findings and summary */
  getBatchReport: (batchId, token) =>
    get(`/v1/batches/${batchId}/report`, { token }),

  // ── Regulator ─────────────────────────────────────────────────────────────

  /** National overview: totals, open flags, avg score */
  getOverview: (year = 2026, token) =>
    get(`/v1/regulator/overview?year=${year}`, { token }),

  /** Institutions list with filters */
  getInstitutions: (year = 2026, state, token) => {
    const params = new URLSearchParams({ year });
    if (state) params.append('state', state);
    return get(`/v1/regulator/institutions?${params}`, { token });
  },

  /** Integrity score breakdown for one institution */
  getIntegrity: (instId, year = 2026, token) =>
    get(`/v1/institutions/${instId}/integrity?year=${year}`, { token }),

  /** Flags with optional filters */
  getFlags: (params = {}, token) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/v1/flags${qs ? '?' + qs : ''}`, { token });
  },

  /** Duplicate radar results */
  getRadar: (year = 2026, token) =>
    get(`/v1/regulator/radar?year=${year}`, { token }),

  /** Trigger rule engine run */
  runRules: (year = 2026, token) =>
    post(`/v1/system/run-rules?year=${year}`, { token }),

  /** Quota ledger: NRI, OCI, FN, Supernumerary (Req 2) */
  getQuotaLedger: (year = 2026, token) =>
    get(`/v1/regulator/quota-ledger?year=${year}`, { token }),

  /** Admission Season Replay timeline (interactive scrubber) */
  getReplay: (year = 2026, token) =>
    get(`/v1/regulator/replay?year=${year}`, { token }),

  /** Official Accreditation / Regulatory report (Req 9) */
  getAccreditationReport: (year = 2026, token) =>
    get(`/v1/regulator/reports/accreditation?year=${year}`, { token }),

  // ── Credentials ───────────────────────────────────────────────────────────

  /** Issue a verifiable credential for an enrolment */
  issueCredential: (enrolmentId, token) =>
    post('/v1/credentials/issue', {
      body: {
        enrolment_id: enrolmentId,
        expires_days: 365
      },
      token
    }),

  /** Public verification — no auth required */
  verifyCredential: (handle) =>
    get(`/v1/verify/${encodeURIComponent(handle)}`),

  /** Revoke a credential */
  revokeCredential: (credId, token, reason = 'Student requested or withdrawn') =>
    post(`/v1/credentials/${credId}/revoke`, {
      body: { reason },
      token
    }),

  /** Get QR image data URI or base64 */
  getQR: (credId, token) =>
    get(`/v1/credentials/${credId}/qr`, { token }),

  // ── Student ───────────────────────────────────────────────────────────────

  /** Fetch the logged-in student's enrolments + access history */
  getMyRecords: (token) =>
    get('/v1/student/me/records', { token }),

  /** Submit a "this is not me" dispute */
  createDispute: (data, token) =>
    post('/v1/student/me/disputes', { body: data, token }),

  /** Withdraw consent for APAAR data processing */
  withdrawConsent: (purpose = 'all', token) =>
    post('/v1/student/me/consent/withdraw', {
      body: { purpose },
      token
    }),

  // ── Privacy & Audit ───────────────────────────────────────────────────────

  /** Run a scan to confirm 0 raw IDs stored */
  runPrivacyProof: (token) =>
    get('/v1/system/privacy-proof', { token }),

  /** Verify the cryptographic audit chain */
  verifyAuditChain: (token) =>
    get('/v1/audit/verify', { token }),

  /** Fetch today's signed daily root */
  getDailyRoot: (token) =>
    get('/v1/audit/daily-root', { token }),
};
