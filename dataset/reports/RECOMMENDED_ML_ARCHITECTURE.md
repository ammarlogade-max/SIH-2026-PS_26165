# SIF Sentinel — Recommended ML & Safety Intelligence Architecture
## SIH 2026 — Problem Statement SIH26165
**Scientifically Defensible, Evidence-Grounded Offshore Safety Decision Support System**

---

### Executive Summary

To satisfy the requirements of SIH26165 while rigorously respecting the empirical boundaries established by **Dataset v2.1** (specifically the 377:1 SIF class imbalance and the complete absence of negative non-SIF regulatory alerts), the SIF Sentinel architecture is formulated as a **Scientifically Defensible Hybrid System**.

Rather than deploying an uncalibrated black-box neural network that hallucinates binary SIF classifications, the system allocates functional responsibilities across **six distinct architectural modalities**, matching each sub-task to the most robust computational paradigm:

1. **DETERMINISTIC RULES**: Safety engineering physics, energy thresholds, and fail-safe gating.
2. **LLM / NLP EXTRACTION**: Span-grounded information extraction of equipment, energy mechanisms, and barriers.
3. **ML CLASSIFIER**: Multi-label classification of IOGP Life-Saving Rules and Positive-Unlabeled (PU) precursor ranking.
4. **RETRIEVAL ENGINE**: Dense semantic search (BM25 + Contriever) against verified historical precursor incidents.
5. **DYNAMIC CLUSTERING**: Unsupervised pattern discovery across Site, Activity, and Barrier Failure Modes.
6. **HUMAN-IN-THE-LOOP WORKFLOW**: Auditable HSE adjudication, review actions, and non-destructive version control.

---

### 1. Component Modality Matrix

| System Component | Recommended Modality | Rationale & Engineering Justification | Fallback / Governance Mechanism |
| :--- | :--- | :--- | :--- |
| **High-Energy Hazard Gating** | **DETERMINISTIC RULES** | Energy release thresholds (Pressure $> 100$ psi, Voltage $> 440$ V, Suspended Loads $> 1000$ kg) are physical engineering facts defined by IOGP and API RP 75. Statistical ML models risk false negatives on catastrophic energy releases. | Any ambiguous high-energy term routes directly to `SIF_TRIGGERED`. |
| **IOGP Life-Saving Rules** | **ML CLASSIFIER (Multi-Label)** | Incidents frequently breach multiple concurrent rules (310 multi-rule events in v2.1). DeBERTa-v3 with multi-label BCE captures complex narrative nuance beyond brittle regex. | Negative-lookbehind regex filters prevent false positives (e.g., "struck" $\rightarrow$ "truck"). |
| **Entity & Span Extraction** | **LLM / NLP EXTRACTION** | Safety reports contain varied syntactic phrasing. Modern token extractors reliably extract verbatim text spans grounding hazards, barriers, and injuries. | Strict exact substring validator ($S_{\text{span}} \subseteq S_{\text{text}}$); invalid spans rejected. |
| **SIF Precursor Scoring** | **ML CLASSIFIER (PU Learning)** | Standard binary classification is mathematically invalid under 377:1 skew. Non-negative PU learning (nnPU) ranks precursor propensity using unlabeled background without fabricating negative labels. | Uncalibrated score is explicitly labeled as `PRECURSOR_INDEX`; never called a probability. |
| **Historical Precursor Search** | **RETRIEVAL ENGINE (Hybrid)** | Enables safety officers to compare incoming reports with verified BSEE/IMCA alerts within milliseconds. | Hybrid dense vector (Contriever) + sparse lexical (BM25) with source filtering. |
| **Recurring Pattern Discovery** | **DYNAMIC CLUSTERING** | Discovers emerging failure trends across Site, Activity, Barrier, and Energy without imposing rigid pre-conceived taxonomy. | HDBSCAN density clustering with minimum support threshold $\ge 3$ and Poisson trend testing. |
| **Safety Decision Finalization** | **HUMAN REVIEW (HSE Loop)** | Life safety cannot be delegated autonomously to an AI model. Qualified HSE officers maintain final operational authority. | Five-state review workflow: `CONFIRM`, `REJECT`, `EDIT`, `UNKNOWN`, `ESCALATE`. |

---

### 2. End-to-End System Workflow & Data Flow

```
                     Incoming Safety / Near-Miss Report Text
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. NLP / LLM INFORMATION EXTRACTION LAYER                                   │
│    • Physical Equipment Extraction (Whitelisted Machinery Entities)         │
│    • Hazard Energy Mechanism Span Extraction (Pressure, Thermal, Kinetic...)│
│    • Barrier Identification & Status (INTACT, DEGRADED, FAILED, ABSENT)     │
│    • Personnel Exposure / Line-of-Fire Verification                         │
│    • Verbatim Substring Grounding Check: Must exist in source text          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌──────────────────────────────────────┐┌─────────────────────────────────────┐
│ 2. DETERMINISTIC SAFETY GATE         ││ 3. ML STATISTICAL INFERENCE ENGINE  │
│    IOGP 4-Step SIF Precursor Rule:   ││    • Multi-Label IOGP Rule Model    │
│    IF (High Energy == TRUE)          ││      (DeBERTa-v3, 9 Sigmoids)       │
│    AND (Barrier == FAILED | ABSENT)  ││    • Positive-Unlabeled (PU) Scorer │
│    AND (Worker Exposure == TRUE)     ││      $S_{\text{ML}} \in [0.00, 1.00]│
│    THEN Gate = SIF_TRIGGERED         ││    • Keyword Boundary Safeguards    │
└───────────────────┬──────────────────┘└──────────────────┬──────────────────┘
                    │                                      │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. INTEGRATED OPERATIONAL TRIAGE & RISK RANKING                             │
│    • P1_CRITICAL:  Deterministic SIF Triggered OR Bodily Injury Documented  │
│    • P2_HIGH:      High Precursor Score ($S_{\text{ML}} \ge 0.75$) + Failed Barrier │
│    • P3_MEDIUM:    Degraded Barrier OR Ambiguous Energy Evidence            │
│    • P4_LOW:       Low Precursor Score ($S_{\text{ML}} < 0.30$) + Intact Controls   │
│    • INDETERMINATE: Critical Information Missing $\rightarrow$ Output "UNKNOWN"      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌──────────────────────────────────────┐┌─────────────────────────────────────┐
│ 5. PRECURSOR SEARCH & RETRIEVAL      ││ 6. DYNAMIC PATTERN CLUSTERING       │
│    Hybrid BM25 + Contriever Query    ││    HDBSCAN Clustering across:       │
│    Returns Top-5 Historical Precursor││    [Site] × [Activity] × [Barrier]  │
│    Events with Verbatim Lessons      ││    Poisson Rate-Ratio Trend Engine  │
│    Learned & Regulatory Citations    ││    (INCREASING, STABLE, DECREASING) │
└───────────────────┬──────────────────┘└──────────────────┬──────────────────┘
                    │                                      │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 7. HUMAN-IN-THE-LOOP HSE INTERACTION DASHBOARD                              │
│    • Source Fact vs Derived Fact vs Model Inference Boundary Display        │
│    • Interactive Evidence Spans Highlighted in Original Narrative           │
│    • Adjudication Controls: [CONFIRM] [REJECT] [EDIT] [UNKNOWN] [ESCALATE]  │
│    • Audit Ledger Logging: User ID, Timestamp, Action, Field Diffs          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Detailed Component Specifications

#### 3.1 Deterministic Safety Gate (IOGP Physical Decision Logic)
The deterministic gate implements the standard offshore industry definition of a SIF Precursor (IOGP Report 459 / Campbell Institute):
$$\text{SIF\_Precursor} \iff (\text{Energy} \in \mathcal{H}) \land (\text{Barrier} \in \{\text{FAILED}, \text{ABSENT}\}) \land (\text{Exposure} = \text{TRUE})$$

Where $\mathcal{H}$ represents high-energy hazard classes:
- Suspended loads exceeding 500 kg or lift height $> 2$ m.
- Stored pressure exceeding 100 psi (hydraulic, pneumatic, or wellhead).
- Working at height $> 1.8$ m without positive fall arrest.
- Flammable or toxic atmosphere exceeding lower explosive limits (LEL).
- Electrical voltage exceeding 440 V AC.

If this deterministic condition is met, the incident is classified as a **SIF Precursor regardless of model score**. Safety physics overrides statistical likelihood.

#### 3.2 Machine Learning Multi-Label IOGP Engine
- **Architecture**: Fine-tuned DeBERTa-v3-base with a 9-dimensional multi-label binary cross-entropy output layer.
- **Input Representation**: Narrative tokens concatenated with facility and activity metadata.
- **Decision Rule**: Threshold $\tau_j$ calibrated per rule on the validation partition:
  $$\hat{y}_j = \mathbb{I}(\sigma(z_j) \ge \tau_j)$$
- **False-Positive Prevention**: Negative token masking. For example, for rule *Driving* (IOGP-03):
  $$\hat{y}_{\text{Driving}} = 0 \quad \text{if} \quad \text{RegexMatches}(r'\b(vehicle|car|truck|van|driving|road|seatbelt|forklift)\b', \text{text}) = \emptyset$$

#### 3.3 Positive-Unlabeled (PU) Precursor Scorer
- **Formulation**: Non-negative Positive-Unlabeled (nnPU) neural ranker.
- **Class Prior ($\pi_p$)**: Fixed at $\pi_p = 0.20$ based on empirical offshore incident study baselines.
- **Output**: Precursor Propensity Index $S_{\text{ML}} \in [0, 1]$.
- **Labeling Standard**: Output is explicitly presented as **"Precursor Propensity Index"**, preventing user misconceptions regarding calibrated event probabilities.

#### 3.4 Hybrid Precursor Search & Retrieval Engine
- **Query Processing**: The narrative of the incoming event is parsed to form both a dense query vector (Contriever) and an expanded keyword sparse query (BM25).
- **Index**: 2,970 canonical events from Dataset v2.1 indexed in FAISS with metadata filters (`source_organization`, `energy_type`, `iogp_rule`).
- **Output**: Top-5 historical analogues, providing immediate operational context, regulatory alert numbers, and historical remedial actions to the safety officer.

#### 3.5 Dynamic Pattern Clustering & Trend Engine
- **Feature Space**: Dense embeddings concatenated with categorical entity embeddings (`Site`, `Activity`, `Barrier Failure`, `Energy`).
- **Clustering Algorithm**: HDBSCAN with `min_cluster_size = 3` to satisfy the support requirement ($\ge 3$ incidents).
- **Trend Detection**: Poisson rate-ratio test comparing report frequencies between rolling temporal windows:
  $$\text{Rate Ratio } RR = \frac{k_{\text{current}} / N_{\text{current}}}{k_{\text{baseline}} / N_{\text{baseline}}}$$
  - $RR > 1.25$ and $p < 0.05 \implies \textbf{INCREASING}$
  - $RR < 0.80$ and $p < 0.05 \implies \textbf{DECREASING}$
  - Otherwise $\implies \textbf{STABLE}$
  - Total events $< 3 \implies \textbf{INSUFFICIENT\_DATA}$

#### 3.6 Human-in-the-Loop HSE Decision Support Interface
The user interface explicitly segregates information credibility:
1. **SOURCE FACT**: Exact quotations from the submitter with character-span highlights.
2. **DERIVED FACT**: Determinations produced by standard safety engineering rules.
3. **MODEL INFERENCE**: Probabilistic rankings accompanied by confidence bounds and similar historical cases.
4. **Interactive Action Bar**:
   - `[CONFIRM]`: Endorses AI triage; updates site risk registers.
   - `[EDIT]`: Opens inline modal to modify extracted equipment, barrier, or rule.
   - `[REJECT]`: Marks prediction as false alarm; routes report to low-priority queue.
   - `[UNKNOWN]`: Flags event as incomplete; sends request for clarification to offshore rig.
   - `[ESCALATE]`: Triggers instant fleet-wide notification for urgent industry hazards.

---

### 4. How the SIH26165 Requirements Are Fully Satisfied

| SIH26165 Challenge Requirement | How the Recommended Architecture Solves It | Scientific Justification |
| :--- | :--- | :--- |
| **"Classify each safety report as SIF-potential or non-SIF-potential"** | Implements the **Hybrid SIF Precursor Gate** (Deterministic IOGP Rules + PU Precursor Propensity Scoring). | Overcomes the 377:1 class imbalance without generating synthetic data or collapsing decision boundaries. |
| **"Map incidents to IOGP Life-Saving Rules"** | Multi-Label DeBERTa-v3 Classifier with exact span evidence grounding and word-boundary false-positive safeguards. | Accurately models the empirical reality of concurrent barrier breaches (310 multi-rule events). |
| **"Identify recurring precursor patterns"** | HDBSCAN clustering across Site, Activity, and Barrier Failure with Poisson temporal trajectory testing. | Prevents sparse false patterns through minimum support thresholds ($\ge 3$) and denominator-normalized trend testing. |
| **"Prioritize sites and activities by SIF risk"** | Mathematically defined `OBSERVED_SIF_PRECURSOR_RATE` ($OSPR_k$) and Composite Priority Index ($OPI_k$). | Replaces misleading raw event counts with mathematically sound, severity-weighted precursor rates. |
| **"Interactive HSE Dashboard"** | Decoupled UI displaying Source Facts, Derived Rules, Model Inferences, and complete 5-action Human-in-the-Loop review. | Ensures full regulatory compliance, human oversight, and transparent explainability. |

---

### 5. Architectural Quality Checklist

- [x] **Zero Synthetic Fabrications**: Operates exclusively on verified empirical data from Dataset v2.1.
- [x] **No Binary Cross-Entropy Collapse**: Standard binary classification is prohibited; PU ranking and safety rules are used.
- [x] **Zero Regex Substring Bugs**: Enforces strict word boundary and syntactic checks ("struck" cannot match "truck").
- [x] **Complete Group Leakage Isolation**: All models evaluated on leak-free group-partitioned splits.
- [x] **Source Vocabulary Generalization**: Enforces cross-source held-out validation (BSEE vs. IMCA).
- [x] **Human Safety Sovereignty**: Autonomous safety decision-making is strictly barred; human HSE authority is preserved.
