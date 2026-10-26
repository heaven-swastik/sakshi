# SAKSHI — System Sequence Diagram

This sequence diagram illustrates the complete end-to-end operational lifecycle of student admission verification in SAKSHI:
**CSV Ingestion $\rightarrow$ Ephemeral APAAR Check $\rightarrow$ Blind Sealing $\rightarrow$ Rule Engine Detection $\rightarrow$ Duplicate Radar Alert $\rightarrow$ Bilateral Inquiry $\rightarrow$ Tripartite Dual-Control Reveal**.

---

```mermaid
sequenceDiagram
    autonumber
    actor College as College Registrar
    participant Gateway as Ingestion Gateway
    participant Registry as APAAR / Digilocker
    participant Tokenizer as HMAC Sealing Engine
    participant DB as SAKSHI Ledger
    actor Regulator as AICTE Regulator
    actor Student as Student (Citizen)

    %% Step 1: Upload & Sealing
    Note over College, Tokenizer: Phase 1: Upload & Blind Sealing (In-Memory Only)
    College->>Gateway: POST /v1/college/upload (CSV batch)
    activate Gateway
    Gateway->>Registry: Ephemeral Check: Does ID exist?
    Registry-->>Gateway: Status: Valid (active)
    Gateway->>Tokenizer: tokenize(raw_id, salt=cohort, key=KMS_SECRET)
    activate Tokenizer
    Tokenizer-->>Gateway: student_token = HMAC-SHA256(raw_id)
    deactivate Tokenizer
    Note over Gateway: Raw ID dropped from RAM immediately
    Gateway->>DB: INSERT Enrolment(institution_id, token, tier="verified", status="active")
    Gateway->>DB: Append AuditLog(action="BATCH_INGEST", hash=sha256(summary))
    Gateway-->>College: 200 OK: Batch Report (verified / attested count)
    deactivate Gateway

    %% Step 2: Rule Engine & Duplicate Radar
    Note over DB, Regulator: Phase 2: Integrity Engine & Duplicate Radar
    Regulator->>Gateway: GET /v1/radar/duplicates?cohort=2026
    activate Gateway
    Gateway->>DB: Query cross-institution collisions (Exclude tier="pending")
    DB-->>Gateway: Duplicate Group: Token_X enrolled in Inst_A & Inst_B
    Gateway-->>Regulator: Return Duplicate Cluster (Collision detected)
    deactivate Gateway

    %% Step 3: Bilateral Inquiry (Ask Owner, Not Database)
    Note over Regulator, College: Phase 3: Bilateral Inquiry Notice
    Regulator->>Gateway: POST /v1/radar/inquiry (token_hash, reason="Cross-seat overlap")
    activate Gateway
    Gateway->>DB: CREATE Case & Flag(type="R1_DUPLICATE_CROSS_INSTITUTION")
    Gateway->>DB: Append AuditLog(action="INQUIRY_ISSUED", recipient=[Inst_A, Inst_B])
    Gateway-->>College: Automated Clarification Notice dispatched to Inst_A & Inst_B
    Gateway-->>Regulator: 200 OK: Inquiry Reference ID logged
    deactivate Gateway

    %% Step 4: Tripartite Dual-Control Identity Reveal
    Note over Regulator, Student: Phase 4: Tripartite Consensus Reveal Protocol
    Regulator->>Gateway: POST /v1/regulator/reveal/request (case_id, token, justification)
    activate Gateway
    Gateway->>DB: CREATE RevealRequest(status="PENDING_APPROVALS")
    Gateway->>DB: Append AuditLog(action="REVEAL_INITIATED", req_id)
    Gateway-->>Regulator: RevealRequest #101 Created (1/3 approvals)
    deactivate Gateway

    College->>Gateway: POST /v1/college/reveal/approve (req_id, rederived_token)
    activate Gateway
    Note over College, Gateway: College verifies token matches local student ERP record
    Gateway->>DB: UPDATE RevealRequest(college_approved=True)
    Gateway->>DB: Append AuditLog(action="REVEAL_COLLEGE_APPROVED", match=True)
    Gateway-->>College: 200 OK: College Approval Recorded (2/3 approvals)
    deactivate Gateway

    Student->>Gateway: POST /v1/student/reveal/consent (req_id, consent=True)
    activate Gateway
    Gateway->>DB: UPDATE RevealRequest(student_consented=True, status="UNSEALED")
    Gateway->>DB: Append AuditLog(action="REVEAL_UNSEALED", tripartite_complete=True)
    Gateway-->>Student: 200 OK: Consent Recorded
    deactivate Gateway

    Regulator->>Gateway: GET /v1/regulator/reveal/101
    activate Gateway
    Gateway->>DB: Check: Regulator + College + Student all approved?
    DB-->>Gateway: Status: UNSEALED
    Gateway-->>Regulator: 200 OK: Identity Unsealed (Match confirmed by College)
    deactivate Gateway
```

---

## Key Protocol Milestones

1. **Ephemeral Boundary**: Lines 3–7 ensure that student IDs are held in memory only long enough to perform one cryptographic HMAC computation and verify existence against the registry.
2. **Deterministic Radar**: Lines 10–14 allow regulator oversight of multiple concurrent seat occupancies without decrypting student identity.
3. **Decentralized Resolution**: Lines 15–20 send automated notices to college registrars rather than performing invasive surveillance.
4. **Tripartite Consensus**: Lines 21–38 enforce that an identity unseal cannot be executed unilaterally by any single authority; it requires joint digital consent from regulator, college, and citizen.

