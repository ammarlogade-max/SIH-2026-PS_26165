# SIF Sentinel — Adversarial Hard Negative Audit v2.2.1
**Benchmark Asset:** `dataset/derived/iogp_hard_negatives.jsonl`  
**Record Type:** `SYNTHETIC_ADVERSARIAL_BENCHMARK`  
**Total Benchmark Examples:** 126  

---

## 1. Segregation & Safety Guarantee
- **Canonical Corpus Purity:** 100% real-world. Zero synthetic events exist in `events_v2_2_1.jsonl`, `training_gold.jsonl`, `training_silver.jsonl`, or split files.
- **Purpose:** Used strictly for out-of-band evaluation of keyword over-triggering and adversarial counter-trigger sensitivity.
- **Coverage:** All 9 IOGP rules have counterfactual examples (e.g. bypass road != bypassing safety control; manual lifting != mechanical lifting; hot weather != hot work).
