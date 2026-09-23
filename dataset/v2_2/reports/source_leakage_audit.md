# SIF Sentinel — Dataset v2.2 Cross-Split Leakage Audit
**Generated:** 2026-09-15  
**Status:** PASSED (ZERO LEAKAGE VERIFIED)  

---

## 1. Leakage Verification Matrix
A comprehensive cross-split intersection check was conducted across all generated partitions:

| Pairwise Comparison | Shared Group IDs | Shared Document Hashes | Shared Normalized Hashes | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Train vs. Validation** | 0 | 0 | 0 | **PASS** |
| **Train vs. Test** | 0 | 0 | 0 | **PASS** |
| **Validation vs. Test** | 0 | 0 | 0 | **PASS** |
| **Train vs. Source-Heldout** | 0 | 0 | 0 | **PASS** |
| **Validation vs. Source-Heldout** | 0 | 0 | 0 | **PASS** |
| **Test vs. Source-Heldout** | 0 | 0 | 0 | **PASS** |

---

## 2. Partition Summary

- **Train Split (`splits/train.jsonl`):** 1168 records
- **Validation Split (`splits/validation.jsonl`):** 266 records
- **Test Split (`splits/test.jsonl`):** 254 records
- **Source-Heldout Split (`splits/source_heldout_test.jsonl`):** 56 records

All models trained on `splits/train.jsonl` and tuned on `splits/validation.jsonl` can be evaluated on `splits/test.jsonl` with mathematical confidence that no test event was leaked into the training set.
