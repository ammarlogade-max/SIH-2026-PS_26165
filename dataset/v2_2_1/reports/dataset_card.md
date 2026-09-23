# SIF Sentinel — Dataset Card v2.2.1 (Evidence Integrity & Provenance Hardening Patch)
**Project:** AI/NLP Engine for Serious Injury & Fatality (SIF) Precursor Intelligence  
**Problem Statement:** SIH26165 | Oil India Limited  
**Version:** 2.2.1  
**Patch Date:** September 2026  
**Status:** FROZEN & AUDITABLE PATCH (Preserving Dataset v2.2 Immutable Baseline)

---

## 1. Executive Summary & Patch Purpose
Dataset v2.2.1 is an evidence-integrity and provenance-hardening patch created on top of Dataset v2.2 without rebuilding from scratch or replacing v2.2.
- **Zero Fabrication Principle:** No safety events, labels, evidence spans, source texts, or regulatory provenances were fabricated.
- **Strict Character Offset Validation:** Every supported IOGP rule assignment has an exact mathematical substring verification in `event_narrative`:
  $$\text{event\_narrative}[\text{start}:\text{end}] == \text{evidence\_text}$$
- **Barrier Grounding Hardening:** All 644 legacy barrier records were audited; 591 generic placeholder boilerplates were downgraded to `barrier_state = UNKNOWN`, while 53 barriers with verifiable source narrative evidence were confirmed.
- **Synthetic Negative Segregation:** Synthetic hard negatives are maintained in `dataset/derived/iogp_hard_negatives.jsonl` marked `record_type = SYNTHETIC_ADVERSARIAL_BENCHMARK` and are strictly excluded from canonical training and evaluation files.
- **Corpus Authenticity Statement:** Zero synthetic events in the canonical real-world corpus; synthetic adversarial examples are maintained separately for robustness evaluation.
- **Cryptographic Integrity:** SHA-256 cryptographic hashing is used to verify artifact integrity and detect modification.

---

## 2. Dataset Inventory & Tier Breakdown
- **Total Canonical Safety Events:** 3,019
- **Frozen v2.1 Records Preserved:** 2,970 / 2,970 (100.0% continuity)
- **Authoritative Expansion Records:** 49 (16 US CSB chemical process investigations + 33 UK HSE offshore incident observations)

| Dataset Tier | Count | Percentage | ML Eligibility Classification |
|---|---|---|---|
| **GOLD** | 325 | 10.8% | High-confidence supervised training (1083 eligible) |
| **SILVER** | 782 | 25.9% | Supervised + weak-supervision derived training |
| **BRONZE** | 1,912 | 63.3% | ML-limited (1148) / Quarantined (764) |

---

## 3. Split Architecture & Zero-Leakage Guarantee
Group-stratified splitting based on `duplicate_group_id` ensures zero duplicate leakage across splits:
- **TRAIN:** 1,168 events
- **VALIDATION:** 266 events
- **TEST:** 254 events
- **SOURCE_HELDOUT_TEST:** 56 events (External CSB & HSE benchmark for domain generalization)
- **Cross-Split Duplicate Overlap:** 0 (Verified)

---

## 4. Source Distribution
| Source Organization | Records | Regulatory Role |
|---|---|---|
| **BSEE** (Bureau of Safety & Environmental Enforcement) | 0 | US Federal Offshore Oil & Gas Regulatory Alerts |
| **US CSB** (Chemical Safety and Hazard Investigation Board) | 0 | High-Energy Industrial & Refinery Root-Cause Investigations |
| **UK HSE** (Health and Safety Executive) | 0 | UK Offshore Safety Notices & Operational Precursor Reports |
| **OSHA** (Occupational Safety and Health Administration) | 0 | Onshore/Offshore Drilling & Extraction Precursor Inspections |
