# CHANGELOG — Dataset v2.2.1
**Release:** v2.2.1 Evidence Integrity & Provenance Hardening Patch  
**Baseline:** Dataset v2.2 (Immutable and Frozen in `dataset/v2_2/`)  
**Date:** September 2026  
**Author:** SIF Sentinel Safety Data Engineering Engine (SIH26165)

---

## Major Patch Modifications

### 1. IOGP Evidence Integrity & Exact Offset Repair
- Recomputed exact character offsets for all candidate IOGP Life-Saving Rules.
- Verified that `event_narrative[evidence_start:evidence_end] == evidence_text` for 100% of active spans.
- Enforced 5-tier taxonomy: `SUPPORTED` (541), `DERIVED` (546), `AMBIGUOUS` (655), and removed `UNSUPPORTED` (336) from supervised training targets.
- Implemented negative counter-trigger protection against keyword collisions (e.g., driver valves, manual lifting, hot soup).

### 2. Barrier Grounding & Placeholder Removal
- Audited all barrier records across the corpus.
- Downgraded 886 generic boilerplate barrier records (*"Procedural compliance reviewed in narrative"*) to `barrier_state = UNKNOWN`, `quality_flag = DOWNGRADED_GENERIC`, `evidence_status = UNSUPPORTED`.
- Grounded 14 barriers with explicit narrative failure/success statements with exact offsets.

### 3. SIF Precursor Triad Independence
- Decoupled high-energy releases and human exposures from actual injury consequences.
- Prohibited artificial binary FALSE record generation.
- Modeled SIF precursors under PU learning / positive-unlabeled ranking framework.

### 4. Provenance Clarification & Limited Tagging
- Audited 33 UK HSE observation records with index URLs (`https://www.hse.gov.uk/offshore/bulletins.htm`).
- Set `provenance_status = LIMITED` and classified records as `ML_LIMITED`.
- Documented SHA-256 hashing as artifact modification detection rather than external source authenticity.

### 5. Adversarial Hard Negative Segregation
- Hardened `dataset/derived/iogp_hard_negatives.jsonl` with `record_type = SYNTHETIC_ADVERSARIAL_BENCHMARK`.
- Excluded all synthetic records from canonical training, validation, test, and split files.
- Updated documentation to: *"zero synthetic events in the canonical real-world corpus; synthetic adversarial examples are maintained separately for robustness evaluation."*

### 6. v2.1 Continuity
- Preserved all 2,970 original v2.1 event IDs in v2.2.1.
- Documented all text remediation and semantic enrichment changes in `reports/v2_1_continuity_audit.csv`.
