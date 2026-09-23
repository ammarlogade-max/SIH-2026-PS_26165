# SIF Sentinel — Deduplication & Split Isolation Audit v2.2.1
**Algorithm:** Multi-tier Deduplication (SHA-256 Artifact Hash + Normalized Text SimHash + MinHash Jaccard Similarity)  
**Duplicate Groups Preserved:** 2,970 groups from v2.2 baseline  

---

## 1. Split Allocation & Leakage Verification
| Split Name | Records | Duplicate Groups | Cross-Split Leakage |
|---|---|---|---|
| **TRAIN** | 1,168 | Verified Unique | 0 |
| **VALIDATION** | 266 | Verified Unique | 0 |
| **TEST** | 254 | Verified Unique | 0 |
| **SOURCE_HELDOUT_TEST** | 56 | Distinct Org Domain | 0 |

---

## 2. Integrity Confirmation
- Group-stratified splitting guarantees that no exact duplicate, near-duplicate, or identical safety alert crosses split boundaries.
- Generalization testing is strictly independent and uncorrupted.
