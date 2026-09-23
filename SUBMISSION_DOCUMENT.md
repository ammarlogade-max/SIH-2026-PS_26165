# SIF Sentinel — SIH 2026 Submission Document
**Problem Statement ID:** 26165  
**Title:** AI/NLP Engine to Detect Serious Injury & Fatality (SIF) Precursors in OIL's Unsafe-Act/Unsafe-Condition and Near-Miss Reports  
**Organization:** Oil India Limited (OIL)  
**Theme:** Smart Automation | **Category:** Software  

---

## 1. Executive Summary
Oil India Limited operates hundreds of drilling rigs, oil collecting stations (OCS), gas gathering stations (GGS), and pipeline headers across Assam and Rajasthan. Annually, thousands of Unsafe Act / Unsafe Condition (UA/UC) cards and Near-Miss reports are filed. Currently, manual monthly triage allows high-energy precursor conditions to recur undetected until a serious event occurs.

**SIF Sentinel** is an AI/NLP critical barrier intelligence platform designed specifically to solve SIH26165. It ingests free-text safety reports, classifies SIF potential, maps to the 9 IOGP Life-Saving Rules, detects multi-dimensional recurring precursor patterns across activity, location, and barrier failure, ranks sites and activities by SIF precursor density, and provides a closed-loop CAPA effectiveness system with cryptographic audit integrity.

---

## 2. Fulfillment of Mandatory Problem Statement Requirements

| Requirement | Implementation in SIF Sentinel |
|---|---|
| **1. Free-Text Report Ingestion** | Supports single-entry forms and bulk CSV/Excel ingestion with full raw text preservation. |
| **2. UA / UC Support** | First-class event type classification distinguishing worker behavioral acts from physical conditions. |
| **3. Near-Miss Support** | Evaluates near-miss narratives for high-energy hazard exposure and potential consequence. |
| **4. Incident Support** | Historical incident ingestion to validate precursor pathways against actual loss events. |
| **5. SIF-Potential Classification** | Zero-GPU, low-latency (<50ms) deterministic NLP model prioritizing high recall ($F_2 \ge 0.90$). |
| **6. Non-SIF Classification** | Automated filtering of routine housekeeping observations with explainable safe confidence. |
| **7. IOGP Life-Saving Rule Mapping** | Multi-class centroid cosine similarity mapping across all 9 global IOGP rules (Report 459). |
| **8. Recurring Precursor Detection** | Temporal clustering engine detecting recurring and escalating precursor clusters. |
| **9. Activity-Based Patterns** | Clusters hazards by operational task (e.g., Rig Mast Maintenance, Pipe Tripping). |
| **10. Location-Based Patterns** | Hierarchical tracking from Basin down to Rig Floor, Manifold, and Wellhead. |
| **11. Barrier-Failure Patterns** | Decoupled barrier condition evaluation tracking physical bypasses and degradations. |
| **12. Interactive Dashboard** | Modern, responsive Next.js 15 dashboard with zero external runtime dependencies for core workflows. |
| **13. Site SIF Precursor Density Ranking** | Mathematical ranking: $\frac{\text{SIF Precursors}}{\text{Total Reports}} \times 100\%$. |
| **14. Activity SIF Density Ranking** | Mathematical ranking of hazardous activities to target training and SOP reviews. |
| **15. Prioritize HSE Interventions** | Direct linkage between escalating clusters and closed-loop CAPA actions with recurrence tracking. |

---

## 3. Key Innovations (Critical Barrier Intelligence)
1. **Decoupled Safety Science:** Separates SIF classification from barrier evaluation, avoiding circular reasoning.
2. **SIF Pathway Reconstruction:** Maps Hazard $\to$ Energy $\to$ Critical Barrier $\to$ Failure Mode $\to$ Exposure $\to$ Potential Consequence.
3. **Post-Closure CAPA Recurrence:** Flags when a precursor recurs at the same site within 30 days of CAPA closure.
4. **Tamper-Evident Chained Audit Ledger:** SHA-256 cryptographic chain securing all safety decisions for regulatory compliance.

---

## 4. Development Benchmark Notice
*The embedded development dataset contains ~180 synthetic and curated test cases for functional pipeline demonstration. It is not production OIL data. The architecture is engineered with strict schema adapters to immediately accept OIL's production database upon deployment.*
