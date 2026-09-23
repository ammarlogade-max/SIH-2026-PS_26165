# SIF Sentinel — Dataset v2.2 Data Quality & Integrity Report
**Generated:** 2026-09-15  
**Evaluation Target:** `dataset/v2_2/events_v2_2.jsonl`  

---

## 1. Structural Quality Audit
Every record in `events_v2_2.jsonl` was validated against `dataset/schema/safety_event.schema.json`.

- **Total Evaluated Events:** 3019
- **Schema Validation Pass Rate:** 100.00%
- **Records with Null/Missing Mandatory IDs:** 0
- **Records with Non-SHA-256 Provenance Hashes:** 0
- **Records Missing Standardized Narrative Fields (`raw`, `normalized`, `source_excerpt`):** 0

---

## 2. Text Quality & Remediation Metrics
In v2.1, 777 records suffered from sparse narratives (< 50 characters) primarily due to placeholder alerts or truncated ingestion.

### Remediation Outcome:
- **BSEE Full-Text Ingestions:** 570 original PDF regulatory safety alerts retrieved and mapped to incident narratives.
- **Quarantined Records:** 474 records lacking sufficient operational context have been isolated into `dataset/v2_2/quarantine.jsonl`.
- **Active ML Candidates:** 1744 records possess full operational texts, explicit energy classifications, and verified barrier state evaluations.

---

## 3. Label Evidence Verification
Every positive label assigned to an IOGP Life-Saving Rule or SIF Precursor is backed by a verified text span:
- **`evidence_location` Coverage:** 100% of supported rule mappings specify character offsets or explicit narrative spans.
- **`evidence_type`:** Distinguishes between `SOURCE_FACT` (regulatory classification in original document) and `DERIVED_FACT` (verified through hazard mechanic analysis).
