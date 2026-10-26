# SAKSHI — Data Flow Diagrams (DFD)

This document provides formal Data Flow Diagrams (DFD Level 0 and Level 1) for the **SAKSHI** (साक्षी) zero-knowledge enrolment verification platform.

---

## 1. DFD Level 0 — Context Diagram

The Level 0 context diagram demonstrates the boundary of the SAKSHI platform and its interactions with external entities: College Registrars, the AICTE Central Regulator, Students (Citizens), Employers/Public Verifiers, and the Mock/Live APAAR Identity Registry.

```mermaid
flowchart LR
    College["College Registrar"]
    Regulator["AICTE Central Regulator"]
    Student["Student (Citizen)"]
    Verifier["Public / Employer Verifier"]
    APAAR["APAAR / Digilocker Registry"]

    SAKSHI["SAKSHI Zero-Knowledge Platform"]

    College -- "1. Upload Admissions CSV (ID, Roll, Seat)" --> SAKSHI
    SAKSHI -- "2. Batch Audit Receipt & Verification Report" --> College

    SAKSHI -- "3. Query Identity Validity (Ephemeral)" --> APAAR
    APAAR -- "4. Boolean Status (Active / Valid)" --> SAKSHI

    SAKSHI -- "5. Duplicate Radar & Overrun Alerts (Rules R1-R7)" --> Regulator
    Regulator -- "6. Multi-College Inquiries & Reveal Request" --> SAKSHI

    Student -- "7. View Enrolment, Withdraw Consent, File Dispute" --> SAKSHI
    SAKSHI -- "8. W3C-VC-style Signed QR Credential (Ed25519)" --> Student

    Verifier -- "9. Scan Credential QR / Offline Public Key Check" --> SAKSHI
    SAKSHI -- "10. Cryptographic Verification & Revocation Status" --> Verifier
```

---

## 2. DFD Level 1 — Decomposed System Flow

The Level 1 diagram decomposes SAKSHI into its core internal processes and data stores, showing the zero-knowledge memory boundary where raw identifiers are converted into blind tokens and discarded.

```mermaid
flowchart TD
    %% External Entities
    subgraph External_Entities ["External Entities"]
        College["College Registrar"]
        Regulator["AICTE Central Regulator"]
        Student["Student / Citizen"]
        APAAR["APAAR Identity Registry"]
    end

    %% Internal Processes
    subgraph SAKSHI_Engine ["SAKSHI System Processes"]
        P1["1.0 Ingestion & Ephemeral Validation<br/>(Memory Gateway)"]
        P2["2.0 Blind Token Derivation<br/>(HMAC-SHA256 Sealing)"]
        P3["3.0 Rule Engine R1–R7 Execution<br/>(Deterministic Collision Engine)"]
        P4["4.0 Radar & Inquiry Workflow<br/>(Dual-Notice Generator)"]
        P5["5.0 Citizen Portal & Dispute Manager<br/>(Ed25519 Signed Actions)"]
        P6["6.0 Tripartite Reveal Coordinator<br/>(Regulator + College + Student)"]
        P7["7.0 Credential Issuer & Revocation<br/>(Ed25519 JWS Signer)"]
        P8["8.0 Audit Logger & Root Publisher<br/>(SHA-256 Hash Chain)"]
    end

    %% Data Stores
    subgraph Data_Stores ["Data Stores (No Raw PII)"]
        D1[("D1: Institutions & Programs Ledger")]
        D2[("D2: Blind Enrolments Ledger (Tokens Only)")]
        D3[("D3: Compliance Flags & Cases (R1-R7)")]
        D4[("D4: Cryptographic Credentials Ledger")]
        D5[("D5: Signed Student Disputes")]
        D6[("D6: Tripartite Reveal Requests")]
        D7[("D7: SHA-256 Chained Audit Log")]
    end

    %% Data Flows
    College -->|"Admissions CSV (Raw ID in RAM)"| P1
    P1 <-->|"Ephemeral Validation Ping"| APAAR
    P1 -->|"Ephemeral Raw ID"| P2
    P2 -->|"Blind Token (Discards Raw ID)"| D2
    P1 -->|"Intake Counts"| D1

    D2 -->|"Aggregated Blind Tokens"| P3
    D1 -->|"Approved Quota Matrix"| P3
    P3 -->|"Generated Flags (R1-R7)"| D3

    D3 -->|"Flag Alerts & Collision Metrics"| P4
    P4 <-->|"View Radar & Issue Inquiries"| Regulator
    P4 -->|"Inquiry Dispatch Notices"| College

    Student <-->|"Query Enrolment via Blind Token"| P5
    P5 -->|"Signed Dispute Record"| D5
    P5 -->|"Consent Status (assurance_tier)"| D2

    Regulator -->|"Initiate Reveal Request"| P6
    College -->|"Confirm Match (re-derived token)"| P6
    Student -->|"Consent to Unseal"| P6
    P6 <-->|"State & Approvals"| D6

    D2 -->|"Active Enrolment Data"| P7
    P7 -->|"Signed Credential"| D4
    P7 -->|"QR Credential"| Student

    P1 -.->|"Batch Log"| P8
    P3 -.->|"Flag Audit Log"| P8
    P4 -.->|"Inquiry Audit Log"| P8
    P5 -.->|"Dispute Audit Log"| P8
    P6 -.->|"Reveal Step Audit Log"| P8
    P8 -->|"Append Hash Entry"| D7
    D7 -->|"Audit Proof & Daily Root"| Regulator
```

---

## 3. Key Data Flow Architectural Guarantees

1. **Zero-Persistence Guarantee**: In Process `1.0` and `2.0`, raw student identifiers reside exclusively in volatile memory buffers for the duration of the HMAC computation and are immediately released. No column in `D1` through `D7` stores raw identifiers.
2. **Opt-Out & Consent Boundary**: If a student opts out or withdraws consent (`assurance_tier == 'pending'`), Process `3.0` (Rule Engine) excludes the record from cross-college collision detection in `D3`, preserving institutional count accuracy while preventing cross-institutional tracking.
3. **Audit Immutability**: All write operations through processes `1.0` through `6.0` append an entry to `D7` linking to the previous record's SHA-256 digest, anchored daily by an Ed25519-signed root.

