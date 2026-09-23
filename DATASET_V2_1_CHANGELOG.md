# SIF Sentinel Dataset v2.1 Changelog
## Semantic Ground-Truth Remediation & Entailment Gate Release

**Release Date:** September 14, 2026  
**Status:** Canonical Supervised & Precursor Corpus (Semantic Remediation Layer)  
**Parent Version:** Dataset v2.0.0 (Preserved intact in `dataset/final/events_final_v2.jsonl`)

---

### Executive Summary

Dataset v2.1 represents the **final semantic integrity gate** for the SIF Sentinel offshore safety intelligence dataset. While Dataset v2 achieved mathematical and cryptographic provenance consistency (100% SHA-256 match, 2,970 canonical events, zero accounting discrepancies), field-level semantic entailment auditing revealed critical heuristic artifacts from earlier automated pipelines. 

Dataset v2.1 resolves all identified semantic contradictions strictly adhering to the **Section 27 Non-Generative Repair Policy**:
- **Zero Hallucination / Zero Generative Fabrication**: No synthetic records, negative labels, or artificial balancing were introduced.
- **Objective Entailment**: Corrections were applied only where the underlying source text explicitly documents the ground truth.
- **Traceable Versioning**: Dataset v2 remains completely untouched and auditable.

---

### Key Remediation Metrics

| Remediation Category | Records Modified | Ground-Truth Rationale |
| :--- | :--- | :--- |
| **Consequence Contradictions Repaired** | **30** | Restored explicit source-documented injuries (burns, fractures, hospitalizations) that had erroneously defaulted to `injury: null` and "None reported". |
| **Equipment Entity Cleaned / Remapped** | **2779** | Purged consequence and hazard keywords (`burn`, `fire`, `dropped`, `pressure`, `blowout`, `rupture`, etc.) from `context.equipment`. Extracted authentic physical equipment from source text where available; set unsupported entities to `null`. |
| **Event Types Reclassified** | **4** | Corrected severe injury and major loss-of-containment events misclassified as Unsafe Acts (UA) or Unsafe Conditions (UC) back to `INCIDENT` or `NEAR_MISS`. |
| **Unsupported Facilities Reset** | **43** | Replaced unevidenced boilerplate facility placeholders (e.g. platform/vessel without narrative mention) with `UNKNOWN`. |
| **False IOGP Driving Rules Purged** | **150** | Removed regex false-positive "Driving" rules where "struck" falsely matched "truck" in crane, rigging, and dropped object events. |
| **Generic PTW Barrier Defaults Cleaned** | **112** | Replaced over-specific "Permit to Work & JSA" mappings with "Risk Assessment & Task Planning" where text only referenced task risk assessments. |

---

### ML Eligibility Distribution in v2.1

To prevent invalid or skewed records from leaking into machine learning workflows, every event in v2.1 is assigned an explicit `ml_eligibility` status:

- **`ML_ELIGIBLE` (378)**: Gold and Silver records with 100% verified textual evidence, verified consequences, defensible SIF potential, and zero duplicate leakage risk. Suitable for supervised hazard characterization.
- **`ML_LIMITED` (20)**: Bronze and unverified records suitable strictly for rule-based safety gating, precursor retrieval, and weakly supervised clustering.
- **`UNLABELED` (154)**: Unlabeled records where SIF potential is `UNKNOWN`.
- **`REFERENCE_ONLY` (7)**: Authoritative cross-jurisdiction regulatory benchmarks (UK HSE) reserved for out-of-domain evaluation.
- **`QUARANTINED` (2411)**: Records isolated due to catalog-only metadata without full narrative text.

---

### Scientific Transparency Notice

1. **Extreme Class Skew**: The supervised pool contains 380 SIF TRUE vs 1 SIF FALSE. **This dataset is NOT suitable for training a naive binary classifier.** Machine learning models must use positive-unlabeled (PU) learning, multi-hazard multi-label classification, or heuristic safety gates.
2. **Observation Gap**: Actual Unsafe Acts (4 reclassified, leaving remaining pure behavioral observations) and Unsafe Conditions remain sparse due to the high-severity publishing bias of regulatory authorities.
