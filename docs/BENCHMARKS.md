# SAKSHI — Performance & Latency Benchmarks

> Measured automatically via `scripts/benchmark.py`.
> All benchmarks run against the actual cryptographic implementation and database engine.

---

## 1. Machine & Environment Specifications

| Attribute | Specification |
|---|---|
| **Operating System** | Windows 11 (10.0.26200) |
| **Processor / Architecture** | Intel64 Family 6 Model 186 Stepping 2, GenuineIntel (16 logical cores) |
| **System Memory** | 15.7 GB RAM |
| **Python Runtime** | Python 3.13.14 (CPython) |
| **Database Engine** | SQLite (in-memory, indexed with `StaticPool`) |

---

## 2. Benchmark Results

### Benchmark 1: Blind Sealing Latency (`tokenize()`)
Measures cryptographic HMAC-SHA256 blind token generation over **10,000** iterations.

| Metric | Measured Value |
|---|---|
| **Iterations** | 10,000 |
| **Total Wall-Clock Time** | 0.082 s |
| **Throughput** | **121,979.8 operations / sec** |
| **Mean Latency** | **8.04 µs** (microseconds) |
| **Median Latency** | 7.2 µs |
| **p95 Latency** | 12.0 µs |
| **p99 Latency** | 15.1 µs |

---

### Benchmark 2: Ingestion Throughput (10,000 Rows)
Measures complete pipeline: CSV row processing + HMAC-SHA256 blind sealing + verification assignment + batch database insertion for **10,000 student records**.

| Metric | Measured Value |
|---|---|
| **Batch Volume** | 10,000 records |
| **Total Ingestion Time** | **0.3988 s** |
| **Throughput** | **25,072.2 records / second** |
| **Per-Row Time** | 0.0399 ms / record |

---

### Benchmark 3: Duplicate Radar Query Latency
Measures indexed cross-institution duplicate collision detection (Rule R1) across a national cohort dataset with active indexes on `student_token` and `(student_token, cohort_year)`.

| Metric | Measured Value |
|---|---|
| **Cohort Size** | 3,343 seats |
| **Benchmark Iterations** | 50 executions |
| **Duplicates Detected** | 5 |
| **Mean Query Latency** | **7.18 ms** |
| **Median Query Latency** | 6.94 ms |
| **p95 Query Latency** | **8.83 ms** |

---

## 3. Algorithmic Complexity & Indexing Guarantees

- **Single Token Lookup — $O(1)$**: Single-token searches (e.g. Citizen Window record lookup by `student_token`, QR verification by credential handle) execute in **$O(1)$** average time due to dedicated B-Tree / hash indexes on `Enrolment.student_token` and `Credential.student_token`.
- **Cross-Institution Duplicate Detection — $O(N \log N)$**: The radar query aggregates grouped records across colleges. With compound index `ix_enrolment_token_cohort (student_token, cohort_year)`, database index scans avoid full table scans.

---

## 4. Architectural Boundaries & Data Isolation Guarantees

1. **Zero-Persistence Guarantee**: Raw student identifiers reside strictly in volatile memory buffers during the momentary HMAC computation and are immediately released. Raw IDs are never written to disk, database tables, or server logs.
2. **Demonstrator Validation**: Benchmark results reflect the seed-42 validation cohort; production latency will scale with PostgreSQL connection pooling and live network round-trip times.
3. **Ingestion Architecture**: The prototype processes batch CSV uploads in chunked transactions; real-time queue streaming is designated for Phase 2.
