# SIF Sentinel — Dataset v2.2 Release Changelog
**Version:** 2.2.0-enterprise  
**Release Date:** September 15, 2026  
**Problem Statement:** SIH26165  

---

## 1. Key Highlights
- **Corpus Expansion:** Expanded from 2,970 baseline records to **3019 canonical safety events**.
- **Process Safety Incidents:** Ingested 16 landmark deepwater and refinery investigations from the U.S. Chemical Safety Board (CSB).
- **Behavioral & Condition Audits:** Ingested 33 authentic Unsafe Act (UA), Unsafe Condition (UC), and Near-Miss reports from the UK Health and Safety Executive (HSE).
- **BSEE Full-Text Extraction:** Remediated 227 sparse BSEE records using local text extractions from official regulatory documents.
- **IOGP Life-Saving Rules Multi-Pass Engine:** Multi-label coverage balanced across all 9 rules, eliminating under-representation.
- **Adversarial Hard Negatives:** Released 126 counterfactual test challenges in `dataset/derived/iogp_hard_negatives.jsonl`.
- **Zero-Leakage Group Stratification:** Enforced group-stratified splits across 2917 incident clusters.
- **Complete Enterprise Documentation:** Published Dataset Card, Data Quality Report, Deduplication Audit, ML Readiness Report, and Machine-Readable Gates.
