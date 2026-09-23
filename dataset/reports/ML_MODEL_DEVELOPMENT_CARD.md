# SIF Sentinel — Machine Learning Model Development Card
## SIH 2026 — Problem Statement SIH26165
**Safety Intelligence & Model Governance Specification**

---

### 1. Model Details & Identity
- **Model Name**: SIF Sentinel Precursor Intelligence Suite (v2.1 Development Architecture).
- **Model Type**: Hybrid System comprising Multi-Label Transformer Classifiers (DeBERTa-v3), Positive-Unlabeled (PU) Risk Scoring, Semantic Dense Retrieval (BM25 + Contriever), and Deterministic Safety Engineering Gates.
- **Release Version**: 2.1.0-DEV (Corresponds to Dataset v2.1).
- **Date**: September 14, 2026.
- **Developers**: SIF Sentinel Research & Engineering Team (SIH 2026).
- **License / Governance**: Open Engineering Benchmark; Public Domain Regulatory Data.

---

### 2. Intended Use
- **Primary Objective**: Assist offshore Health, Safety, and Environment (HSE) professionals, offshore installation managers (OIMs), and safety analysts by triaging incoming safety reports, incident logs, and near-miss narratives.
- **Intended Tasks**:
  1. Automated extraction of physical hazard mechanisms and energy releases (e.g., pressure, thermal, gravitational).
  2. Multi-label classification of breached or relevant IOGP Life-Saving Rules (IOGP Report 459).
  3. Precursor risk ranking to surface high-consequence near-misses that warrant priority investigation.
  4. Discovery of recurring failure patterns across sites, activities, and barrier failure modes.
  5. Retrieval of historically similar precursor events from regulatory archives.
- **Operating Mode**: **Decision Support System (Human-in-the-Loop)**. The model provides structured extraction and priority ranking to augment human engineering judgment.

---

### 3. Out-of-Scope & Prohibited Use
- **Autonomous Operations**: The model must **NEVER** be used to autonomously clear work permits, dismiss near-miss reports, or reduce field inspection schedules without human sign-off.
- **Direct Real-Time Emergency Shutdown**: The system is designed for safety intelligence and precursor analysis, not for millisecond SCADA or Safety Instrumented System (SIS) trip actuation.
- **Stand-Alone Binary SIF Adjudication**: Using the model to issue an unreviewed, autonomous "Non-SIF" verdict to bypass regulatory reporting is strictly prohibited.
- **Unverified Proprietary Extrapolation**: The model must not be assumed to reflect proprietary corporate operating philosophies without local calibration on internal operator datasets.

---

### 4. Training Data & Provenance
- **Corpus Origin**: Public regulatory and industry alerts from:
  - **Bureau of Safety and Environmental Enforcement (BSEE)**: 574 events (US Gulf of Mexico OCS).
  - **International Marine Contractors Association (IMCA)**: 2,388 events (Global Offshore Marine Contractors).
  - **Health and Safety Executive (UK HSE)**: 8 events (North Sea Benchmarks; held out as `REFERENCE_ONLY`).
- **Total Canonical Events**: 2,970 records.
- **Eligible Training/Tuning Pool (`ML_ELIGIBLE`)**: 378 records possessing 100% verified narrative text, exact substring evidence grounding, and audited consequence entailment.
- **Quarantined Corpus (`QUARANTINED`)**: 2,411 catalog records lacking narrative detail, permanently isolated from training.
- **Internal Data Demarcation**: **Zero internal proprietary OIL data exists in this corpus.** It represents an external industry and regulatory development corpus.

---

### 5. Known Biases & Empirical Limitations

#### 5.1 Surveillance & Publishing Bias
Regulatory agencies and industry federations publish safety alerts **only when an event is severe, unusual, or carries high potential for catastrophic loss**. Routine, low-energy, and uneventful work is completely absent from the dataset. 

#### 5.2 Extreme SIF Class Imbalance
Within the supervised `ML_ELIGIBLE` cohort, the SIF label distribution is:
$$\text{SIF TRUE}: 377 \quad (99.74\%) \quad \text{vs.} \quad \text{SIF FALSE}: 1 \quad (0.26\%)$$
This extreme distribution reflects publishing criteria rather than true offshore operational frequencies. Standard supervised binary cross-entropy is mathematically broken under this condition.

#### 5.3 Unsafe Act / Unsafe Condition (UA/UC) Scarcity
The dataset contains only **11 pure Unsafe Acts (UA)** and **22 Unsafe Conditions (UC)**. The remaining 2,937 records describe actual incidents or dangerous occurrences. Models trained on this dataset cannot reliably distinguish behavioural observations from physical near-misses.

#### 5.4 Cross-Regulatory Terminology Divergence
BSEE narratives use US federal regulatory jargon (*"MMS"*, *"OCS"*, *"lessee"*, *"casing slip"*), while IMCA narratives reflect European and international marine contractor phrasing (*"dynamic positioning"*, *"vessel master"*, *"dive technician"*, *"gangway"*). Without source-held-out validation, NLP models risk learning source identity instead of physical safety mechanisms.

---

### 6. Evaluation Methodology & Leakage Protection

- **Group-Based Partitioning**: To eliminate data leakage caused by duplicate reporting or multi-part documents, all splits partition by `duplicate_group_id` and `incident_group_id`. No overlapping incident or document group exists between training, validation, and test splits.
- **Source-Held-Out Evaluation**: Cross-source evaluation (Train on IMCA, Test on BSEE; and vice-versa) is mandatory to measure semantic transferability across international operating theaters.
- **Negative Control Suites**: Synthetic and empirical negative test cases (e.g. testing whether "worker was struck by crane load" triggers the "Driving" rule) are evaluated to guarantee zero keyword substring false positives.
- **Metrics Hierarchy**:
  - Multi-Label IOGP: Macro F1, Micro F1, Hamming Loss.
  - Hazard Extraction: Token-level Precision, Recall, and F1 with exact span containment verification.
  - SIF Precursor Ranking: PR-AUC, Recall@Top-20%, Brier Score.

---

### 7. Human Oversight & Operational Safety Interface

- **Mandatory HSE Verification**: Every high-priority SIF precursor prediction requires explicit adjudication by a qualified safety engineer through the review actions:
  - **`CONFIRM`**: Validates prediction; permanently logs verified precursor into audit trail.
  - **`EDIT`**: Modifies extracted attributes (equipment, barrier, rule); updates human consensus layer.
  - **`REJECT`**: Overrules model as false alarm; logs reason for algorithm retraining.
  - **`UNKNOWN`**: Flags incomplete narrative for operational inquiry.
  - **`ESCALATE`**: Triggers immediate fleet-wide safety stand-down alert.
- **Non-Destructive Governance**: Human review decisions are stored in an append-only ledger and never overwrite the original raw source narrative.

---

### 8. Potential Failure Modes & Mitigation Strategies

| Failure Mode | Root Cause | Safety Risk | System Mitigation |
| :--- | :--- | :--- | :--- |
| **False Negative on Severe Precursor** | Narrative omits explicit energy keywords (e.g., subtle well kick symptoms). | High-energy near miss is triaged as low priority. | Conservative Deterministic Safety Gate triggers on ambiguous high-pressure or drilling context; sends to HSE review. |
| **Keyword False Positive (e.g. "Struck" $\rightarrow$ "Driving")** | Substring overlap in naive tokenizers. | Operational noise; misallocation of transport safety resources. | Word-boundary tokenization + syntactic dependency parsing + negative lookbehinds in rule extractor. |
| **Probability Hallucination** | Model outputs 0.99 confidence on poorly grounded narrative. | Automation bias; uncritical acceptance of AI output. | Model score is displayed as "Uncalibrated Precursor Index"; raw probability is never claimed as calibrated without empirical Brier verification. |
| **Entity Inversion** | Consequence word placed into equipment field (e.g., equipment = "burn"). | Corrupts equipment reliability databases. | Strict entity whitelist and semantic ontology filter in post-processing pipeline. |
| **Denial of Indeterminacy** | Model forced to choose binary outcome when text lacks information. | Erroneous safety conclusions based on zero evidence. | The system explicitly supports and outputs **`UNKNOWN`** whenever evidence spans cannot be identified. |
