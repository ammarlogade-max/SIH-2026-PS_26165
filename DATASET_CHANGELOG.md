# SIF Sentinel Dataset Changelog

All notable changes to the SIF Sentinel Dataset will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

---

## [2.0.0] - 2026-09-14 (Forensic Audit & Remediation Release)

### Added
- **Cryptographic Provenance Audit Report (`dataset/reports/document_provenance_audit.csv`):** Full audit of all 852 documents (851 in v1 manifest + 1 recovered on-disk artifact `SRC-BSEE-0571.pdf`), verifying that 564 on-disk files match their SHA-256 hashes with 100.00% precision, and classifying 288 un-downloaded entries as `MISSING_ARTIFACT`.
- **BSEE Forensic Audit (`dataset/reports/bsee_forensic_audit.csv`):** Comprehensive investigation into the presence of "Marine Minerals Administration" in BSEE alerts. Verified that Alerts 521, 524, and 525 from August 2026 contain authentic federal DOI reorganization notices.
- **Reference Taxonomies (`dataset/reference_taxonomy/`):**
  - `iogp_life_saving_rules.json`: Canonical IOGP Report 590 taxonomy with 9 Life-Saving Rules.
  - `sif_precursor_definitions.json`: Campbell Institute, CSRA HECAT, and Dekra SIF definitions and energy thresholds.
  - `barrier_taxonomy.json`: Engineered, physical, procedural, and human barrier classifications.
- **Deduplication & Leakage Prevention Ledger (`dataset/manifests/duplicate_groups.csv`):** Cluster IDs (`duplicate_group_id`, `incident_group_id`) across 2,969 unique groups for leak-free cross-validation.
- **Evidence Ledger (`dataset/manifests/evidence_ledger.jsonl`):** 2,309 machine-readable entries linking every semantic field to verbatim source text.
- **Quarantine Framework (`dataset/quarantine/` and `dataset/manifests/quarantine_manifest.csv`):** Isolation of 2,411 records lacking physical source artifacts.
- **Prioritized Manual Review Queue (`dataset/reports/manual_review_queue.csv`):** 2,772 prioritized review tickets categorized by P0 (2,411), P1 (158), and P2 (203).
- **ML-Ready Partition Subsets (`dataset/final/`):**
  - `training_gold.jsonl` (97 verified, explicit SIF records)
  - `training_silver.jsonl` (284 verified, derived SIF records)
  - `unlabeled_unknown.jsonl` (2,261 records for unsupervised clustering / RAG)
  - `reference_only.jsonl` (8 UK HSE reference bulletins)
- **Comprehensive Forensic Audit Report (`dataset/reports/DATASET_FORENSIC_AUDIT_REPORT.md`):** Complete analysis answering all 23 forensic questions.

### Changed
- **Canonical Event Dataset (`dataset/final/events_final_v2.jsonl`, `dataset/final/events_final_v2.csv`):**
  - Reclassified mislabeled events (e.g. EVT-BSEE-0001 from `UA` to `INCIDENT` due to burn injury).
  - Purged hardcoded generic facility defaults ("Offshore Production / Drilling Facility" -> `UNKNOWN`).
  - Separated raw HTML extractions into `raw_source_text`, `cleaned_source_text` (free of web chrome/navigation), and `event_narrative`.
  - Enforced strict SIF criteria separating `EXPLICIT`, `DERIVED`, and `UNKNOWN`.
  - Added explicit provenance tags: `is_oil_internal: false` and `data_origin: EXTERNAL_GOVERNMENT_REGULATORY` or `EXTERNAL_INDUSTRY_ASSOCIATION`.
- **Document Manifest V2 (`dataset/manifests/document_manifest_v2.csv`):** Scoped strictly to the 564 verified physical files on disk, incorporating the previously unmanifested `SRC-BSEE-0571.pdf`.
- **Source Manifest V2 (`dataset/manifests/source_manifest_v2.csv`):** Updated with exact verified on-disk document counts and domain boundaries.

---

## [1.0.0] - 2026-09-14 (Initial Pipeline Release)

### Added
- Ingestion pipeline scripts (`scripts/run_dataset_pipeline.js`, `scripts/build_canonical_dataset.js`).
- Initial canonical event dataset with 2,970 records.
- Automated validation test suite (`tests/dataset_validation.test.ts`).
