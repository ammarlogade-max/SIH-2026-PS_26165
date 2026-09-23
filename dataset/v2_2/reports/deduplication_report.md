# SIF Sentinel — Dataset v2.2 Deduplication Audit Report
**Engine:** Three-Tier Multi-Level Deduplication Engine  
**Analyzed Records:** 3019  

---

## 1. Methodology
To prevent model memorization and optimistic evaluation bias, the deduplication engine executes three distinct detection layers:
1. **Tier 1 (Exact Document Hash):** SHA-256 digest of original raw document payload.
2. **Tier 2 (Normalized Narrative Hash):** SHA-256 digest of normalized text stripped of formatting, boilerplate headers, and punctuation.
3. **Tier 3 (Character Tri-Gram Jaccard Clustering):** Connected-component union-find clustering over short text variants.

---

## 2. Deduplication Results

| Metric | Value | Interpretation |
| :--- | :--- | :--- |
| **Total Event Records** | 3019 | Total ingested corpus size |
| **Unique Incident Groups** | 2917 | Distinct real-world physical incidents |
| **Duplicate Instances Identified** | 102 | Multi-agency cross-postings or variant updates |
| **Duplicate Status: UNIQUE** | 2917 | Canonical representative records |
| **Duplicate Status: EVENT_DUPLICATE** | 102 | Secondary variants linked to canonical group |

---

## 3. Group Splitting Guarantee
All records sharing a `duplicate_group_id` are strictly forced into the exact same split partition. Zero incident groups span across Train, Validation, or Test splits.
