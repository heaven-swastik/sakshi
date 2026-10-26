# SAKSHI — Entity-Relationship (ER) Diagram

This diagram visualizes the relational schema defined in [`api/models.py`](file:///e:/projects/sakshi%20sih%202nd/api/models.py).

### Fundamental Privacy Covenant
No table or column anywhere in this schema persists a raw student identifier (Aadhaar, APAAR ID, name, email, phone number, or date of birth). All cross-institutional correlations and citizen actions operate strictly through `student_token` (a one-way HMAC-SHA256 blind seal).

---

```mermaid
erDiagram
    INSTITUTION {
        int id PK
        string aicte_perm_id UK
        string name
        string state
        string institution_type
        string region
        datetime created_at
    }

    PROGRAM {
        int id PK
        int institution_id FK
        string course
        string level
        string mode
        string affiliating_body
    }

    INTAKE_APPROVAL {
        int id PK
        int program_id FK
        int academic_year
        int approved_intake
        string counting_rule_version
    }

    BATCH {
        int id PK
        int institution_id FK
        string uploaded_by_role
        int cohort_year
        int rows_total
        int rows_accepted
        int rows_rejected
        string status
        datetime created_at
    }

    BATCH_FINDING {
        int id PK
        int batch_id FK
        int row_no
        string code
        string message
    }

    ENROLMENT {
        int id PK
        int institution_id FK
        int program_id FK
        int cohort_year
        string student_token "Indexed"
        string id_type
        string assurance_tier
        string mode
        string seat_category
        string status
        int batch_id FK
        datetime created_at
    }

    CONSENT {
        int id PK
        string student_token "Indexed"
        string purpose
        string status
        datetime recorded_at
        datetime withdrawn_at
    }

    RULE_VERSION {
        int id PK
        string rule_id
        text params_json
        string created_by
        datetime active_from
    }

    FLAG {
        int id PK
        string rule_id
        string rule_version
        string severity
        string state
        text institution_ids_json
        string student_token_ref "Indexed"
        text evidence_json
        text explanation
        datetime created_at
    }

    CASE {
        int id PK
        int flag_id FK
        string assignee
        string status
        text notes_json
        datetime due_at
        datetime closed_at
        string outcome
    }

    REVEAL_REQUEST {
        int id PK
        int case_id FK
        string requested_by
        string approved_by
        string reason_code
        string status
        text institution_responses_json
        datetime created_at
    }

    INTEGRITY_SCORE {
        int id PK
        int institution_id FK
        int program_id FK
        int academic_year
        float score
        text components_json
        text explanation
        string rule_version
        datetime computed_at
    }

    STUDENT_DISPUTE {
        int id PK
        string student_token "Indexed"
        int institution_id FK
        string dispute_type
        string status
        string signature
        datetime created_at
        datetime resolved_at
    }

    AUDIT_LOG {
        int id PK
        datetime ts
        string actor_id
        string actor_role
        string action
        string object_type
        string object_id
        string payload_hash
        string prev_hash
        string entry_hash
    }

    AUDIT_ROOT {
        int id PK
        string date UK
        string merkle_root
        text signature
    }

    CREDENTIAL {
        int id PK
        string student_token "Indexed"
        int program_id FK
        int cohort_year
        string credential_handle UK
        string status
        datetime issued_at
        datetime expires_at
        string key_id
        text jws_payload
    }

    CREDENTIAL_STATUS_ENTRY {
        int id PK
        int credential_id FK
        datetime revoked_at
        string reason
    }

    VERIFICATION_EVENT {
        int id PK
        int credential_id FK
        string verifier_role
        string purpose_code
        string result
        datetime ts
    }

    DAILY_SEAT_COUNT {
        int id PK
        int program_id FK
        string snapshot_date
        int reported
        int verified
        int attested
        int pending
    }

    %% Relationships
    INSTITUTION ||--o{ PROGRAM : offers
    INSTITUTION ||--o{ BATCH : uploads
    INSTITUTION ||--o{ ENROLMENT : enrols
    INSTITUTION ||--o{ INTEGRITY_SCORE : receives
    INSTITUTION ||--o{ STUDENT_DISPUTE : subject_of

    PROGRAM ||--o{ INTAKE_APPROVAL : has
    PROGRAM ||--o{ ENROLMENT : admits
    PROGRAM ||--o{ CREDENTIAL : issues
    PROGRAM ||--o{ DAILY_SEAT_COUNT : aggregates

    BATCH ||--o{ BATCH_FINDING : logs
    BATCH ||--o{ ENROLMENT : contains

    FLAG ||--o{ CASE : triggers
    CASE ||--o{ REVEAL_REQUEST : initiates

    CREDENTIAL ||--o{ CREDENTIAL_STATUS_ENTRY : revokes
    CREDENTIAL ||--o{ VERIFICATION_EVENT : audits
```

---

## Schema Architecture Notes

1. **Compound Indexing for Radar Performance**:
   - `ix_enrolment_token_cohort (student_token, cohort_year)` enables sub-10 ms detection across thousands of admissions.
   - `ix_enrolment_inst_prog_cohort (institution_id, program_id, cohort_year)` powers instant intake overrun checks.
2. **Cryptographic Signatures in Ledger**:
   - `STUDENT_DISPUTE.signature` stores HMAC/Ed25519 signatures of the citizen's dispute statement.
   - `AUDIT_ROOT.signature` stores Ed25519 signatures of the daily Merkle root for external auditability.
   - `CREDENTIAL.jws_payload` stores the compact Ed25519 JWS token for client-side and offline verification.
3. **Decoupled Identity**:
   - Neither `CONSENT` nor `STUDENT_DISPUTE` nor `REVEAL_REQUEST` requires raw identity data to operate securely.

