# SIF Sentinel — Data Quality & Integrity Report v2.2.1
**Evaluation Standard:** SIH26165 Enterprise NLP Audit Standard  
**Dataset Version:** 2.2.1  
**Patch Scope:** Strict Character Offset Verification, Barrier De-biasing, Provenance Hardening

---

## 1. Character Offset & Evidence Integrity Audit
Every IOGP assignment in v2.2.1 was evaluated against the raw source narrative.

- **Total IOGP Evaluations Audited:** 2,111
- **Mathematically Verified Exact Offsets:** 1,844
- **Offset Verification Formula:** `event_narrative[evidence_start:evidence_end] == evidence_text` (100% pass on all verified spans)
- **Evidence Status Taxonomy:**
  - **SUPPORTED:** 564 (Explicit narrative evidence; high-confidence supervised training)
  - **DERIVED:** 577 (Derived from explicit operational facts; weak supervision only)
  - **AMBIGUOUS:** 703 (Partial match or alternative interpretation; excluded from supervised training)
  - **UNSUPPORTED:** 267 (No defensible evidence in narrative; removed from label set)

---

## 2. Barrier Grounding & De-biasing Audit
Legacy safety datasets frequently inject generic placeholder text (e.g., *"Procedural compliance reviewed in narrative."*). Dataset v2.2.1 removes all such ungrounded placeholders.

- **Total Barrier Objects Audited:** 900
- **Generic Placeholders Downgraded:** 886
  - Status set to: `barrier_state = UNKNOWN`, `quality_flag = DOWNGRADED_GENERIC`, `evidence_status = UNSUPPORTED`
- **Grounded Barriers with Verifiable Source Evidence:** 14
  - Exact sentence offsets verified in narrative
  - Assigned states: `FAILED`, `DEGRADED`, or `EFFECTIVE` based strictly on explicit source text.

---

## 3. Provenance & Regulatory Authenticity Audit
- **Total Records Audited:** 3,019
- **SHA-256 Cryptographic Artifact Verification:** All 3,019 records possess valid SHA-256 hashes verifying artifact integrity.
- **UK HSE Observation Records (33 records):**
  - Audited against UK HSE bulletin repository.
  - Documented as having generic bulletin index URLs (`https://www.hse.gov.uk/offshore/bulletins.htm`).
  - Classified as `provenance_status = LIMITED` and `ml_eligibility = ML_LIMITED`.
  - Preserved without synthetic fabrication.
