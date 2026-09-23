# SIF Sentinel — Dataset v2.2 Dataset Card
**Smart India Hackathon 2026 (SIH26165)**  
**Version:** 2.2.0-enterprise  
**Release Date:** September 15, 2026  
**License:** Permissive Research & Evaluation / Regulatory Public Domain Attribution  
**Lead System:** SIF Sentinel AI/NLP Serious Injury & Fatality Prevention Engine  

---

## 1. Executive Summary & Purpose
Dataset v2.2 represents the authoritative benchmark and training corpus for detecting **Serious Injury and Fatality (SIF) Precursors** across Oil & Gas upstream, midstream, and marine operations. It unifies high-fidelity regulatory safety alerts, marine contractor bulletins, and process safety incident reports into a canonical JSONL schema designed specifically for machine learning and causal NLP architectures.

- **Total Canonical Safety Events:** 3019
- **Unique Incident Groups:** 2917
- **Gold-Tier Verified Records:** 586
- **Silver-Tier Verified Records:** 1158
- **Machine Learning Ready Splits:** Train (1168), Validation (266), Test (254), Source-Heldout (56)
- **Curated IOGP Hard Negatives:** 126

---

## 2. Source Provenance & Data Ingestion
All records in Dataset v2.2 originate from verifiable, authoritative public regulatory bodies and industry safety forums. No generative artificial text or hallucinated events were introduced.

| Source Organization | Jurisdiction / Sector | Total Records | Percentage |
| :--- | :--- | :--- | :--- |
| **Bureau of Safety and Environmental Enforcement (BSEE)** | US Gulf of Mexico / Offshore O&G | 574 | 19.01% |
| **International Marine Contractors Association (IMCA)** | Global Marine & Diving Operations | 2388 | 79.10% |
| **Health and Safety Executive (UK HSE)** | UK North Sea Continental Shelf | 41 | 1.36% |
| **U.S. Chemical Safety and Hazard Investigation Board (CSB)** | US Refining, Petrochemical & Deepwater | 16 | 0.53% |

---

## 3. Label Taxonomy & Precursor Mapping

### 3.1 IOGP Life-Saving Rules (Report 590 Taxonomy)
The corpus features multi-label coverage across all nine 2018 IOGP Life-Saving Rules:
- **Safe mechanical lifting:** 614 (20.34%)
- **Line of fire:** 261 (8.65%)
- **Work authorization:** 208 (6.89%)
- **Hot work:** 165 (5.47%)
- **Working at height:** 139 (4.60%)
- **Driving:** 114 (3.78%)
- **Energy isolation:** 101 (3.35%)
- **Bypassing safety controls:** 83 (2.75%)
- **Confined space:** 67 (2.22%)

### 3.2 Precursor Triad Definition (CSRA HECAT Standard)
Under the Construction Safety Research Alliance (CSRA) and Campbell Institute framework, an event is classified as `sif_potential: TRUE` if and only if:
1. High-energy hazard is identified (Pressure, Gravitational, Thermal, Electrical, Kinetic, Chemical, Hydraulic).
2. Worker presence in the direct line of fire or exposure path is established.
3. Critical direct barrier was missing, degraded, or failed.

---

## 4. Leakage-Proof Splitting Protocol
To guarantee strict machine learning integrity, splitting is performed via **Group Stratification**:
- Clustered by `duplicate_group_id` (SHA-256 narrative and document equivalence).
- All instances of identical or near-identical incident reports are strictly confined to a single partition.
- **Train / Val / Test Ratio:** 70% / 15% / 15% of trainable groups.
- **Source-Heldout Test Set:** 100% heldout evaluation on non-training government sources (CSB, HSE) to measure domain transfer and out-of-distribution generalization.
