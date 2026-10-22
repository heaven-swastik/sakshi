# SAKSHI — Institutional ERP Integration & Webhook Specification (PS SIH26263 Req 7)

## 1. Overview
SAKSHI provides integration capability for existing institutional Student Information Systems (SIS) and Enterprise Resource Planning (ERP) platforms used by AICTE-approved institutions (e.g., **Samarth eGov**, **SAP Student Lifecycle Management**, **Tally Education**, **NIC SIS**).

Institutions can integrate via:
1. **Batch Ingestion API** (`POST /v1/batches`) for scheduled end-of-admission sync.
2. **Real-time Student Record Update API** (`POST /v1/enrolments/update`) for immediate seat adjustments.
3. **Outbound Regulatory Webhooks** for receiving real-time duplicate notices and dispute alerts.

---

## 2. Authentication & Authorization
All integration endpoints require a signed JWT token bearing the `institution` role:
```http
Authorization: Bearer <INSTITUTION_SCOPED_JWT>
X-AICTE-Permanent-ID: MH001
X-Idempotency-Key: 7b3a9e21-4f10-4822-92ab-62e91f0c224a
```

* **Idempotency Keys:** Every mutation must provide an `X-Idempotency-Key` header (UUIDv4) cached for 24 hours to prevent duplicate admissions during network retries.
* **Transient Memory Covenant:** The incoming `id_value` is processed strictly in volatile memory, checked against the APAAR registry adapter, tokenized with the cohort KMS secret, and discarded. Raw student IDs are never saved.

---

## 3. Real-Time Student Record Update API

### `POST /v1/enrolments/update`
Allows institutions to update the enrolment status (e.g. admission cancellation, branch change, category correction) of an existing seat using the student's APAAR ID.

#### Request Payload:
```json
{
  "id_type": "APAAR",
  "id_value": "987654321098",
  "cohort_year": 2026,
  "action": "status_change",
  "new_status": "cancelled",
  "reason": "Student withdrew admission during Round 2 counselling",
  "evidence_reference": "MIG-CERT-2026-0918"
}
```

#### Response (200 OK):
```json
{
  "status": "success",
  "student_token": "STU-ZRQO3SOOJFVMO",
  "updated_status": "cancelled",
  "active_seats_remaining": 0,
  "audit_entry_id": 8492,
  "message": "Enrolment record updated. Seat capacity released to approved intake."
}
```

---

## 4. Outbound Webhook Events
AICTE pushes regulatory events to institutional endpoints configured in the AICTE Approval Portal.

### Webhook Event Types:
1. `duplicate.detected`: Triggered when an identical student token is detected in another institution under Rule R1.
2. `dispute.opened`: Triggered when a student files a "This is not me" ghost enrolment dispute.
3. `intake.warning`: Triggered when reported admissions reach 95% of approved intake.

#### Webhook Payload Signature:
Every webhook carries an HMAC-SHA256 signature in the `X-Sakshi-Signature` header:
```
X-Sakshi-Signature: sha256=d58e3e4a...
```

#### Sample `duplicate.detected` Payload:
```json
{
  "event_id": "evt_91024",
  "event_type": "duplicate.detected",
  "timestamp": "2026-10-23T02:30:00Z",
  "data": {
    "student_token": "STU-AXECI4H4VCDL6",
    "cohort_year": 2026,
    "conflict_institution_id": 4,
    "rule_id": "R1",
    "severity": "HIGH",
    "action_required": "Respond to bilateral inquiry within 5 business days",
    "docket_url": "https://sakshi.aicte-india.org/radar?case=CASE-2026-1901"
  }
}
```

---

## 5. Security & DPDP Compliance Controls
- **Data Minimization:** Webhook payloads include the pseudonymous `student_token` only; no candidate names or raw IDs are transmitted across networks.
- **Mutual TLS (mTLS):** Required for production institutional ERP connections.
- **Rate Limiting:** 120 requests/minute per institutional permanent ID with standard `429 Too Many Requests` backoff headers.

