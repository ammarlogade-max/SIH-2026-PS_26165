# SIF Sentinel — Dataset v2.2 Label Evidence Audit
**Standard:** Explicit Audit Trail for Regulatory Safety AI  
**Scope:** IOGP Life-Saving Rules and SIF Potential Classifications  

---

## 1. IOGP Life-Saving Rules Evidence Audit
Every positive Life-Saving Rule mapping in Dataset v2.2 contains traceable evidence connecting the classification to explicit text in the source narrative.

| Rule ID | Rule Name | Total Supported | Evidence Quality | Sample Evidence Anchor |
| :--- | :--- | :--- | :--- | :--- |
| **IOGP-01** | Bypassing safety controls | 83 | High | Interlock bypassed, PSV gagged, alarm defeated |
| **IOGP-02** | Confined space | 67 | High | Ballast tank entry, oxygen deficiency, mud pit |
| **IOGP-03** | Driving | 114 | High | Vehicle rollover, forklift impact, road journey |
| **IOGP-04** | Energy isolation | 101 | High | LOTO omitted, unisolated pressure, residual electric |
| **IOGP-05** | Hot work | 165 | High | Torch cutting, grinding sparks in hydrocarbon zone |
| **IOGP-06** | Line of fire | 261 | High | Dropped drill collar, snapback parted mooring line |
| **IOGP-07** | Safe mechanical lifting | 614 | High | Crane wire failure, dropped load, rigging parted |
| **IOGP-08** | Work authorization | 208 | High | Unauthorized task deviation, missing PTW / JSA |
| **IOGP-09** | Working at height | 139 | High | Fall from derrick, open deck grating, unhooked lanyard |

---

## 2. Hard Negatives Corpus
To prevent naive keyword matching (e.g. classifying "cardiac arrest" as electrical, or "crane bird" as lifting), `dataset/derived/iogp_hard_negatives.jsonl` provides 126 curated counterfactual challenges.
