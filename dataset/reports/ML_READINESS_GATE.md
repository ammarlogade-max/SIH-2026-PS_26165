# SIF Sentinel — Final ML Readiness, Evaluation & Architecture Gate
## SIH 2026 — Problem Statement SIH26165
**Scientific Feasibility, Statistical Entailment, and Model Governance Gate for Dataset v2.1**

---

### Executive Summary & Scientific Mandate

Following full cryptographic provenance verification, numerical reconciliation, and field-level semantic entailment auditing, **Dataset v2.1** (`dataset/final/events_final_v2_1.jsonl`) stands as the official candidate dataset for machine learning development. 

This ML Readiness Gate addresses the primary scientific question:
$$\textbf{"What machine-learning claims can Dataset v2.1 actually support?"}$$

Rather than forcing an inappropriate machine-learning paradigm onto heavily biased empirical data, this gate establishes strict boundaries between what is **statistically defensible** and what is **statistically invalid**.

#### Primary Determinations
1. **Standard Binary SIF Classification is PROHIBITED**: With **377 SIF TRUE vs 1 SIF FALSE** in the `ML_ELIGIBLE` cohort, the dataset suffers from near-total negative label absence due to regulatory reporting thresholds. Training a standard binary cross-entropy classifier is mathematically invalid.
2. **Defensible Hybrid Architecture Selected**: SIF precursor identification must be framed as a **Rule + ML Hybrid Architecture** combining deterministic safety gates (high energy, barrier failure, exposure), Positive-Unlabeled (PU) risk ranking, multi-label hazard extraction, and dense precursor retrieval.
3. **Strict Separation of Concerns**: The system strictly isolates **Model Probability**, **Safety Gate Result**, and **Operational Priority** to prevent uncalibrated machine confidence from overriding engineering safety rules.
4. **Public Industry Scope Acknowledged**: The corpus originates entirely from public regulatory bodies (BSEE, IMCA, UK HSE). It is framed as an **Industry & Regulatory Development Corpus**, with zero claims of proprietary internal OIL validation.

---

### 1. Canonical Dataset Status (Computed Directly from `events_final_v2_1.jsonl`)

The following statistics were programmatically computed directly from `dataset/final/events_final_v2_1.jsonl` (2,970 canonical events):

| Dimension | Category / Value | Count | Distribution (%) |
| :--- | :--- | :--- | :--- |
| **Total Canonical Events** | Total Corpus | **2,970** | 100.00% |
| **Source Distribution** | International Marine Contractors Association (IMCA) | **2,388** | 80.40% |
| | Bureau of Safety and Environmental Enforcement (BSEE) | **574** | 19.33% |
| | Health and Safety Executive (UK HSE) | **8** | 0.27% |
| **Event Types** | NEAR_MISS | **1,515** | 51.01% |
| | INCIDENT | **1,422** | 47.88% |
| | Unsafe Condition (UC) | **22** | 0.74% |
| | Unsafe Act (UA) | **11** | 0.37% |
| **SIF Potential** | UNKNOWN | **2,261** | 76.13% |
| | TRUE | **695** | 23.40% |
| | FALSE | **14** | 0.47% |
| **SIF Label Types** | UNKNOWN | **2,261** | 76.13% |
| | DERIVED (entailed from high energy + barrier failure) | **435** | 14.65% |
| | EXPLICIT (documented by regulatory authority) | **274** | 9.23% |
| **Quality Tiers** | BRONZE | **2,589** | 87.17% |
| | SILVER | **284** | 9.56% |
| | GOLD | **97** | 3.27% |
| **ML Eligibility** | QUARANTINED (catalog records without full narrative) | **2,411** | 81.18% |
| | ML_ELIGIBLE (verified narrative, evidence & SIF grounding) | **378** | 12.73% |
| | UNLABELED (narrative present, SIF label unknown) | **154** | 5.19% |
| | ML_LIMITED (weak metadata or unverified consequence) | **20** | 0.67% |
| | REFERENCE_ONLY (out-of-domain cross-jurisdiction benchmark) | **7** | 0.24% |
| **IOGP Life-Saving Rules** | Safe mechanical lifting (IOGP-05) | **567** | 19.09% |
| | Line of fire (IOGP-08) | **253** | 8.52% |
| | Work authorization (IOGP-02) | **183** | 6.16% |
| | Working at height (IOGP-04) | **124** | 4.18% |
| | Hot work (IOGP-06) | **121** | 4.07% |
| | Driving (IOGP-03; verified vehicle/forklift events) | **61** | 2.05% |
| | Energy isolation (IOGP-07) | **56** | 1.89% |
| | Confined space (IOGP-09) | **47** | 1.58% |
| | Bypassing safety controls (IOGP-01) | **9** | 0.30% |
| **Energy Classifications** | UNKNOWN (unspecified or complex system) | **1,756** | 59.12% |
| | PRESSURE (hydraulic, pneumatic, wellbore) | **420** | 14.14% |
| | THERMAL (fire, steam, hot surface, flare) | **366** | 12.32% |
| | GRAVITATIONAL (dropped objects, falls from height) | **282** | 9.50% |
| | KINETIC (rotating equipment, line parting, collision) | **88** | 2.96% |
| | ELECTRICAL (arc flash, high-voltage contact) | **45** | 1.52% |
| | CHEMICAL (H2S, toxic vapour, acid release) | **13** | 0.44% |
| **Harm Consequences** | Documented Bodily Injuries | **668** | 22.49% |
| | Documented Fatalities | **322** | 10.84% |
| **Deduplication Groups** | Unique Duplicate / Incident Groups | **2,969** | - |
| | Unique Source Document Groups | **2,970** | - |

---

### 2. Final ML Population Audit & Tier Reconciliation

A rigorous reconciliation between the manual quality tiers and automated `ml_eligibility` was executed:

```
Quality Tiers:
├── GOLD:     97
├── SILVER:  284
└── BRONZE: 2,589
Total:     2,970
```

#### Reconciling (Gold + Silver) vs. ML_ELIGIBLE
$$\text{Gold} + \text{Silver} = 97 + 284 = 381$$
$$\text{ML\_ELIGIBLE} = 378$$
$$\Delta = 381 - 378 = 3 \text{ records}$$

#### Mathematical Explanation of Delta
The 3-record difference is fully reconciled:
- **`EVT-HSE-0004`** (Silver tier, UK HSE): Set to `REFERENCE_ONLY`.
- **`EVT-HSE-0005`** (Silver tier, UK HSE): Set to `REFERENCE_ONLY`.
- **`EVT-HSE-0008`** (Silver tier, UK HSE): Set to `REFERENCE_ONLY`.

All 3 records belong to the UK Health and Safety Executive (HSE). Under the SIF Sentinel Governance Policy, UK HSE records serve as an out-of-domain cross-jurisdiction regulatory reference benchmark and are **strictly barred from entering the training or tuning pools**. Therefore, they were assigned `REFERENCE_ONLY`.

#### Bronze Tier Reconciliation (2,589 Records)
- **QUARANTINED (2,411)**: Legacy catalog records lacking full textual narratives.
- **UNLABELED (154)**: Verified narratives where SIF potential cannot be entailed with certainty.
- **ML_LIMITED (20)**: Records containing partial narrative details suitable for weak supervision or clustering.
- **REFERENCE_ONLY (4)**: Bronze-tier UK HSE records (`EVT-HSE-0001`, `EVT-HSE-0003`, `EVT-HSE-0006`, `EVT-HSE-0007`).
$$\sum = 2,411 + 154 + 20 + 4 = 2,589 \quad (\text{Exact match, } 0 \text{ discrepancy})$$

---

### 3. SIF Classification Feasibility & Statistical Prohibition

The SIF potential label distribution across all population subsets reveals extreme class asymmetry:

| Cohort | Total Records | SIF TRUE | SIF FALSE | SIF UNKNOWN | Class Balance (T : F) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Entire Canonical Corpus** | 2,970 | 695 (23.4%) | 14 (0.5%) | 2,261 (76.1%) | 49.6 : 1 |
| **B. Provenance-Verified Corpus** | 2,970 | 695 (23.4%) | 14 (0.5%) | 2,261 (76.1%) | 49.6 : 1 |
| **C. ML_ELIGIBLE Corpus** | 378 | 377 (99.7%) | 1 (0.3%) | 0 (0.0%) | **377 : 1** |
| **D. Explicitly Labeled Corpus** | 274 | 274 (100.0%) | 0 (0.0%) | 0 (0.0%) | **$\infty$ (No negatives)** |

#### Root Cause: Surveillance & Publishing Bias
Government agencies (BSEE) and international contractors (IMCA) issue **Safety Alerts** and **Safety Flashes** specifically to warn industry about high-severity incidents, catastrophic equipment failures, or near-misses with fatality potential. They do not publish alerts for mundane minor cuts or uneventful shifts. Consequently, non-SIF events are virtually absent from the published historical corpus.

#### Formal Prohibition
$$\textbf{PROHIBITION: Standard supervised binary classification of SIF (TRUE vs. FALSE) is strictly prohibited.}$$

**Technical Justification:**
1. A trivial dummy model predicting `TRUE` 100% of the time achieves **99.74% accuracy** on `ML_ELIGIBLE`.
2. Binary Cross-Entropy loss would collapse probability boundaries, forcing extreme miscalibration.
3. Synthesizing artificial negative examples (e.g. SMOTE or GPT-generated non-SIF events) violates the Non-Generative Repair Policy and hallucinates non-existent offshore operating conditions.
4. Merging `UNKNOWN` into `FALSE` is scientifically false; unlabeled reports frequently describe severe near misses that were simply not triaged.

---

### 4. Evaluation of Potential SIF Architectures

| Approach | Data Requirements | Advantages | Limitations | Suitability for SIH26165 |
| :--- | :--- | :--- | :--- | :--- |
| **A. Standard Binary Classifier** | Balanced True & False labels | Simple loss function | Catastrophic failure under 377:1 imbalance; 0 negative examples | **PROHIBITED** |
| **B. Positive-Unlabeled (PU) Learning** | Confirmed Positives + Large Unlabeled Pool | Learns SIF boundary using unlabeled events (2,261) as background | Requires calibrated propensity score $e(x)$; assumption of Selected At Random (SAR) | **CONDITIONALLY ACCEPTABLE** (as ranking auxiliary) |
| **C. One-Class / Anomaly Detection** | Dense positive embeddings | No negative labels required | Fails on text semantics; alerts are diverse in vocabulary | **LOW SUITABILITY** |
| **D. Rule + ML Hybrid** | Energy thresholds, barrier status, exposure + ML hazard extraction | Transparent, 100% explainable, aligns with offshore safety engineering (IOGP/API RP 75) | Requires robust NLP parser for energy and barriers | **STRONGLY RECOMMENDED (Primary Architecture)** |
| **E. Retrieval-Based Precursor Matching** | Text embeddings of historical alerts | Allows instant similarity search to known SIF events | Does not output a binary decision; requires HSE interpretation | **STRONGLY RECOMMENDED (Precursor Search)** |
| **F. Risk Ranking / Scoring** | Continuous risk indices based on energy and failure mode | Provides actionable prioritization without binary collapse | Score thresholding requires human calibration | **RECOMMENDED (Priority Engine)** |
| **G. Multi-Label Hazard / Energy Extraction** | Supervised energy and rule labels | High data support (Pressure, Thermal, Gravitational); balanced classes | Solves hazard characterization, not overall SIF outcome | **RECOMMENDED (Feature Backbone)** |

#### Architectural Decision
The scientifically defensible system for SIH26165 is a **Deterministic Safety Gate + Precursor Extraction + PU Risk Ranking Hybrid**:
$$\text{Safety Decision} = \text{SafetyGate}(\text{Extracted Hazards}, \text{Barriers}, \text{Exposure}) \lor \text{PrecursorRiskScore} \ge \tau$$

---

### 5. SIF Precursor Detection Architecture

To satisfy the SIH requirement of classifying incoming safety reports while respecting empirical limitations, the architecture decouples model evaluation into three distinct layers:

```
Incoming Incident / Near-Miss Report
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ 1. NLP INFORMATION EXTRACTION (Span-Grounded)          │
│    - High-Energy Source: Pressure / Thermal / Gravity  │
│    - Critical Barrier Status: FAILED / DEGRADED        │
│    - Personnel Exposure: LINE OF FIRE / AT HEIGHT      │
│    - Physical Equipment: Crane / Flare / BOP / Valve   │
└───────────────────────┬────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ 2. INDEPENDENT ML SCORE  │  │ 3. DETERMINISTIC GATE    │
│    PU Precursor Score    │  │    IOGP 4-Step SIF Rule: │
│    $P(\text{Precursor})$ │  │    High Energy + Failed  │
│    (0.00 – 1.00)         │  │    Barrier + Exposure    │
└────────┬─────────────────┘  └────────┬─────────────────┘
         │                             │
         └──────────────┬──────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ 4. TRIAGE & OPERATIONAL PRIORITY ENGINE                │
│    - CRITICAL (Confirmed SIF / Life Hazard)            │
│    - HIGH PRECURSOR (Failed Barrier under High Energy) │
│    - MEDIUM (Degraded Barrier / Ambiguous Exposure)    │
│    - LOW (Observation / Administrative / Minor)        │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ 5. HUMAN-IN-THE-LOOP HSE REVIEW WORKFLOW               │
│    [CONFIRM] [REJECT] [EDIT] [UNKNOWN] [ESCALATE]      │
└────────────────────────────────────────────────────────┘
```

#### Decoupled Triad:
1. **Model Score ($S_{\text{ML}} \in [0, 1]$)**: Pure statistical propensity score from the PU text embedding model. It is **never** artificially inflated by heuristics.
2. **Safety Gate Result ($\text{Gate} \in \{\text{SIF\_TRIGGERED}, \text{NON\_TRIGGERED}, \text{INDETERMINATE}\}$)**: Deterministic evaluation of safety physics (Energy Magnitude $\times$ Barrier Failure $\times$ Exposure).
3. **Operational Priority ($\text{Priority} \in \{\text{P1\_CRITICAL}, \text{P2\_HIGH}, \text{P3\_MEDIUM}, \text{P4\_LOW}\}$)**: HSE routing level driving workflow escalation and review urgency.

---

### 6. Independent Model Probability Governance

To prevent false confidence and automation bias:
- **No Rule Inflation**: The statistical model probability $S_{\text{ML}}$ must be derived strictly from feature weights and NLP representations. It must **not** be multiplied or overwritten by rule matches.
- **Uncalibrated Label**: Unless Platt scaling or isotonic regression is validated on an independent calibration partition with a measured Brier score, the output must be displayed as **"Uncalibrated Model Score"** or **"Precursor Index"**, never as "Calibrated Probability".

---

### 7. IOGP Life-Saving Rule Model (Multi-Label Formulation)

#### Evaluation: Single-Label vs. Multi-Label
In the canonical dataset:
- **2,014 events** possess 0 IOGP rules (pure hazard without specific Life-Saving Rule violation).
- **646 events** possess exactly 1 rule.
- **310 events possess 2 or more concurrent rules** (e.g., *Safe mechanical lifting* AND *Line of fire*; or *Hot work* AND *Work authorization*).

$$\textbf{Conclusion: IOGP Life-Saving Rule classification MUST be formulated as Multi-Label Classification.}$$
Single-label multi-class classification is structurally invalid because offshore incidents regularly breach multiple safety barriers simultaneously.

#### Substring False-Positive Elimination: The "Struck" vs. "Truck" Test
To prevent earlier heuristic errors where "struck by falling load" triggered the **Driving** rule:
- Token-level and syntax-aware tokenization must be enforced.
- Word boundary regex $r'\b(vehicle|car|truck|van|driving|road|seatbelt|forklift)\b'$ must be used in baseline checks.
- Every predicted rule must return:
  1. `rule`: Canonical IOGP rule name.
  2. `confidence`: Binary cross-entropy sigmoid probability $\in [0, 1]$.
  3. `evidence`: Exact source text excerpt grounding the violation.
  4. `mapping_method`: `DETERMINISTIC_EXTRACTION` vs. `MODEL_INFERENCE`.

---

### 8. IOGP Evaluation Dataset & Leakage Protection

To prevent evaluation leakage:
- Evaluation splits must be grouped by **`duplicate_group_id`**, **`incident_group_id`**, and **`document_group_id`**.
- Generated leak-free splits in `dataset/splits/`:
  - `group_stratified_split.json`: 70% Train (264 groups), 15% Validation (56 groups), 15% Test (58 groups). Zero duplicate overlap.
  - `source_held_out_split.json`: Trained on IMCA, evaluated on BSEE out-of-domain to detect regulatory vocabulary memorization.

---

### 9. Precursor Pattern Discovery & Temporal Dynamics

To fulfill the SIH requirement of identifying recurring precursor patterns by **Site**, **Activity**, **Barrier Failure**, and **Energy**:

#### Support Threshold
A pattern is considered a valid recurring cluster only if:
$$\text{Support}(C) \ge 3 \text{ distinct incidents across } \ge 2 \text{ independent reporting periods}$$
Combinations with support $< 3$ are flagged as `SPARSE_ANOMALY` and barred from automated trending.

#### Statistically Defensible Temporal Trend Formulation
Let $N_{t_1}$ and $N_{t_2}$ be the observed counts of cluster $C$ in baseline period $t_1$ and current period $t_2$. Let $T_1$ and $T_2$ be the total operating reports in each window:
$$r_1 = \frac{N_{t_1}}{T_1}, \quad r_2 = \frac{N_{t_2}}{T_2}$$

Using the Poisson exact rate-ratio test with significance level $\alpha = 0.05$:
- **`INCREASING`**: $r_2 / r_1 > 1.25$ and $p\text{-value} < 0.05$.
- **`DECREASING`**: $r_2 / r_1 < 0.80$ and $p\text{-value} < 0.05$.
- **`STABLE`**: $0.80 \le r_2 / r_1 \le 1.25$ or $p\text{-value} \ge 0.05$.
- **`INSUFFICIENT_DATA`**: $\min(N_{t_1}, N_{t_2}) < 3$.

Raw counts must never be compared without denominator normalization.

---

### 10. Site & Activity Prioritization Metric

SIH26165 requires ranking operational sites and activities by SIF precursor risk. When true worker-hour exposure denominators are absent from regulatory archives, calling raw counts "frequency" or "density" is scientifically flawed.

#### Mathematically Defined Metric: `OBSERVED_SIF_PRECURSOR_RATE`
For any operational entity $k$ (e.g. Activity = *Subsea Diving Operations* or Site = *Gulf of Mexico Deepwater*):

$$\text{OSPR}_k = \frac{\sum_{i \in \mathcal{E}_k} w_i \cdot \mathbb{I}(\text{Precursor}_i)}{\sum_{i \in \mathcal{E}_k} 1}$$

Where:
- $\mathcal{E}_k$ is the set of all documented events for entity $k$.
- $\mathbb{I}(\text{Precursor}_i) \in \{0, 1\}$ indicates whether event $i$ involved high energy with failed/degraded barriers.
- $w_i \in [1.0, 3.0]$ is the consequence severity weight ($1.0$ for near-miss with barrier intact; $2.0$ for near-miss with failed barrier; $3.0$ for actual bodily trauma).

#### Composite Operational Priority Index ($OPI_k$):
$$OPI_k = \text{OSPR}_k \times \ln(1 + |\mathcal{E}_k|)$$
This formulation dampens small-sample anomalies (e.g., an activity with only 1 event that happened to be SIF) while heavily penalizing recurring precursor clusters.

---

### 11. Source Bias Analysis & Vocabulary Leakage

Empirical cross-tabulation across sources reveals significant linguistic and systemic divergence:
- **BSEE (Gulf of Mexico OCS)**: Highly formal US regulatory alerts; concentrates heavily on fixed drilling platforms, wellbores, and crane operations. Disproportionately impacted by the "struck/truck" regex bug.
- **IMCA (Global Maritime)**: International offshore contractor safety flashes; diverse maritime terminology (vessels, ROVs, dynamic positioning, divers). High prevalence of lifting operations.
- **UK HSE**: Brief statutory enforcement summaries; highly structured legal framing.

#### Source Leakage Risk:
A generic NLP text classifier trained across sources risks learning **"IMCA terminology"** (e.g., *vessel*, *diver*, *deckhand*) vs **"BSEE terminology"** (e.g., *platform*, *OCS*, *MMS*, *lessee*) rather than universal physical safety semantics.
**Mitigation**: Models must undergo **Source-Held-Out Evaluation** (Train on IMCA, Test on BSEE and vice-versa) to verify out-of-domain transferability.

---

### 12. Evaluation Metrics Beyond Simple Accuracy

| Sub-Task | Primary Evaluation Metric | Secondary Diagnostic Metrics | Justification |
| :--- | :--- | :--- | :--- |
| **IOGP Multi-Label** | **Macro F1 & Micro F1** | Per-Rule Precision/Recall, Hamming Loss | Handles severe class imbalance across infrequent rules (e.g., Bypassing Controls: 9 vs. Lifting: 567). |
| **Hazard Energy Extraction** | **Token-level F1 (Span Precision/Recall)** | Exact Entity Match Rate, Confusion Matrix | Evaluates whether extracted text spans accurately match the physical energy source. |
| **Precursor Risk Ranking** | **PR-AUC (Precision-Recall AUC)** | Top-K Recall, Brier Score, Calibration Curve | ROC-AUC is misleading under extreme imbalance; PR-AUC accurately reflects precision over high-risk alerts. |
| **Precursor Clustering** | **Cluster Stability & Silhouette Score** | Recurrence Support, Temporal Consistency | Measures whether discovered hazard clusters represent genuine repeated failure modes. |

---

### 13. Human-in-the-Loop HSE Review Workflow

To ensure safety integrity, automated outputs serve as a **Decision Support Layer**, never an autonomous authority:

| Review Action | Criteria | System Behavior |
| :--- | :--- | :--- |
| **CONFIRM** | HSE Officer verifies extracted hazards, energy, barrier, and SIF score. | Status becomes `VERIFIED_HUMAN`; record enters audited repository. |
| **EDIT** | Extracted fields contain inaccuracies (e.g., incorrect equipment or rule). | HSE Officer corrects fields; diff is recorded with timestamp and user ID. |
| **REJECT** | Event is non-precursor or false alarm. | Status set to `REJECTED`; model score retained for diagnostic auditing. |
| **UNKNOWN** | Evidence in narrative is insufficient to confirm or deny SIF potential. | Status set to `INDETERMINATE`; additional operational inquiry triggered. |
| **ESCALATE** | High-energy barrier failure with immediate fleet-wide exposure. | Incident escalated to Corporate Safety Leadership and Fleet Notice alert. |

---

### 14. Evidence-Grounded Output Standard

Every AI output presented to users or logged in audits must delineate the evidence boundary:
- **SOURCE FACT**: Exact verbatim quote extracted directly from the narrative (e.g., `"crane wire parted during 15-tonne casing lift"`).
- **DERIVED FACT**: Logical entailment grounded in standard safety engineering definitions (e.g., Energy = `GRAVITATIONAL`, Rule = `Safe mechanical lifting`).
- **MODEL INFERENCE**: Statistical prediction with uncertainty score (e.g., Precursor Index = `0.87`, Uncertainty = `LOW`).

---

### 15. The "UNKNOWN" Output Principle

The system must output **`UNKNOWN`** whenever evidence is absent or contradictory. Forcing a closed binary decision on ambiguous safety data is dangerous and violates engineering ethics.

---

### 16. Test Data Demarcation: Synthetic Demo Isolation

The previously created document **`SIF_Sentinel_Sample_Safety_Report.docx`** is formally designated:
$$\textbf{STATUS: SYNTHETIC\_DEMO}$$
It exists solely for UI ingestion and smoke-testing. It is **strictly barred** from entering any training, validation, or benchmark evaluation pipeline.

---

### 17. Non-Claim of OIL Validation

The dataset consists exclusively of public records from BSEE, IMCA, and UK HSE.
$$\textbf{MANDATE: The system makes zero claims of internal OIL historical data validation.}$$
It is accurately presented as a **Public Industry & Regulatory Development Corpus**, designed to benchmark offshore precursor detection algorithms prior to live operational deployment.

---

### 18. Final GO / LIMITED / NO-GO Decisions

| Capability | Decision | Scientific Rationale & Operating Boundary |
| :--- | :--- | :--- |
| **Standard Binary SIF Classification** | **NO-GO** | **Statistically prohibited.** 377:1 class skew and complete lack of negative labels make supervised binary classification invalid. |
| **Hybrid Precursor Safety Gating & PU Ranking** | **GO** | **Scientifically sound.** Deterministic energy/barrier/exposure gate combined with positive-unlabeled ranking. |
| **Multi-Label IOGP Life-Saving Rule Mapping** | **GO** | **Strongly supported.** 956 multi-label events with verified textual grounding. Word boundary filtering eliminates false positives. |
| **Hazard & Energy Extraction** | **GO** | **Strongly supported.** 1,214 energy-labeled events with exact substring evidence grounding. |
| **Precursor Clustering & Pattern Discovery** | **GO** | **Supported.** Recurrence clustering across Site, Activity, and Barrier Failure with minimum support thresholds $\ge 3$. |
| **Site / Activity Prioritization** | **GO** | **Supported.** Uses mathematically defined `OBSERVED_SIF_PRECURSOR_RATE` ($OSPR_k$) rather than misleading raw frequencies. |
| **Precursor Search & Retrieval** | **GO** | **Strongly supported.** Dense embedding similarity search against verified canonical precursor events. |
