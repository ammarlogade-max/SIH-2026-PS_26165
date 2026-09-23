# SIF Sentinel — Machine Learning Experiment Plan
## SIH 2026 — Problem Statement SIH26165
**Rigorous Experimental Protocol for Offshore SIF Precursor Intelligence**

---

### Executive Overview

This document specifies the four core machine-learning and information-extraction experiments required to support the SIF Sentinel architecture. Each experiment is grounded strictly in the verified contents of **Dataset v2.1** (`dataset/final/events_final_v2_1.jsonl`). 

To ensure complete scientific integrity:
- Every experiment includes a deterministic, simple **baseline** (e.g. regex/keyword or rule-based) against which machine-learning models must demonstrate statistically significant improvement.
- All evaluation splits enforce **zero group leakage** using `duplicate_group_id` and `incident_group_id`.
- Experiments are designed to withstand cross-regulatory vocabulary shift via **source-held-out validation**.

---

### Experiment 1: Multi-Label IOGP Life-Saving Rule Mapping

#### 1.1 Objective
Classify incoming incident narratives into zero, one, or multiple **IOGP Life-Saving Rules** (IOGP Report 459), providing verbatim textual evidence for each predicted rule.

#### 1.2 Dataset & Cohort
- **Cohort**: All `ML_ELIGIBLE` and verified `ML_LIMITED` records with source narrative ($N = 398$).
- **Multi-Label Distribution**:
  - 0 Rules: 142 records
  - 1 Rule: 168 records
  - $\ge 2$ Rules: 88 records
- **Target Rules (9 Labels)**: *Bypassing safety controls, Work authorization, Driving, Working at height, Safe mechanical lifting, Hot work, Energy isolation, Line of fire, Confined space*.

#### 1.3 Features & Inputs
- Full text: `cleaned_source_text` / `event_narrative`.
- Contextual metadata: `location.facility`, `context.activity`.
- Text representation: Pre-trained domain embeddings (DeBERTa-v3 / RoBERTa-large / Legal-BERT).

#### 1.4 Model Candidates
1. **Model A (Baseline)**: Deterministic keyword & word-boundary regex dictionary with negative lookbehinds (e.g., $r'\b(vehicle|truck)\b'$ without $r'struck'$).
2. **Model B**: Logistic Regression / Linear SVM with TF-IDF n-grams (1-3) under Binary Relevance.
3. **Model C**: DeBERTa-v3-small fine-tuned with Multi-Label Binary Cross-Entropy Loss ($L = \sum_{j=1}^9 \text{BCE}(y_j, \hat{y}_j)$).
4. **Model D**: Hybrid Rule-Guided LLM Few-Shot Extractor with JSON schema enforcement.

#### 1.5 Split Strategy & Leakage Prevention
- **Primary Split**: `dataset/splits/group_stratified_split.json` (70% Train / 15% Val / 15% Test).
- **Secondary Split**: `dataset/splits/source_held_out_split.json` (Train on IMCA, Test on BSEE). Zero duplicate group overlap.

#### 1.6 Evaluation Metrics
- **Primary**: Macro F1, Micro F1.
- **Secondary**: Per-Rule Precision & Recall, Exact Match Ratio (Subset Accuracy), Hamming Loss.
- **Negative Test Case**: The "Struck" test suite (evaluating driving false-positive rate on lifting/impact incidents).

#### 1.7 Baseline & Success Criteria
- **Baseline**: Deterministic regex matching. Expected Macro F1: $\approx 0.62$, Micro F1: $\approx 0.74$.
- **Success Threshold**: The candidate model must achieve **$\text{Macro F1} \ge 0.78$** and **$\text{Micro F1} \ge 0.85$**, while achieving **$0.00\%$ false positives** on the "struck vs. truck" benchmark.

#### 1.8 Expected Limitations & Mitigations
- *Limitation*: Extreme class rarity for *Bypassing safety controls* (9 instances).
- *Mitigation*: Threshold tuning per rule rather than a uniform 0.50 cutoff; explicit fallback to deterministic rules for rare classes.

---

### Experiment 2: Multi-Label Hazard & Physical Energy Extraction

#### 2.1 Objective
Identify the physical hazard and energy release mechanism from the report text, extracting both the energy classification and the exact character-level supporting span.

#### 2.2 Dataset & Cohort
- **Cohort**: 1,214 events in Dataset v2.1 with verified energy classifications.
- **Energy Classes**: `PRESSURE` (420), `THERMAL` (366), `GRAVITATIONAL` (282), `KINETIC` (88), `ELECTRICAL` (45), `CHEMICAL` (13).

#### 2.3 Features & Inputs
- Primary input: Raw narrative text tokens.
- Token annotations: BIO tagging (Beginning, Inside, Outside) for energy release mechanisms and physical equipment spans.

#### 2.4 Model Candidates
1. **Model A (Baseline)**: Physical keyword dictionary matching (e.g. psi, bar, hydraulic $\rightarrow$ `PRESSURE`; flare, arc, burn $\rightarrow$ `THERMAL`).
2. **Model B**: BiLSTM-CRF on domain-adapted GloVe / FastText embeddings.
3. **Model C**: Transformer Token Classification (DeBERTa-v3 NER head) fine-tuned on energy and equipment spans.
4. **Model D**: Zero-shot / Few-shot prompt extraction with exact string validation.

#### 2.5 Split Strategy
- Group-stratified 70/15/15 split. Cross-validated across 5 folds.

#### 2.6 Evaluation Metrics
- **Classification**: Macro F1 and Micro F1 across energy types.
- **Span Extraction**: Token-level Precision, Recall, and F1; Exact Substring Match Rate ($100\%$ required for production).

#### 2.7 Baseline & Success Criteria
- **Baseline**: Keyword lookup dictionary. Expected Token F1: $\approx 0.68$.
- **Success Threshold**: Candidate model must achieve **Token F1 $\ge 0.82$** and exact span containment $\ge 98\%$.

---

### Experiment 3: SIF Precursor Ranking via Positive-Unlabeled (PU) Learning

#### 3.1 Objective
Rank incoming incidents and precursor events by their operational SIF potential without assuming that unverified events are non-SIF.

#### 3.2 Dataset & Cohort
- **Positive Cohort ($P$)**: 377 verified SIF TRUE events from `ML_ELIGIBLE`.
- **Unlabeled Background ($U$)**: 2,261 events from `UNLABELED` and `QUARANTINED` pools.
- **Synthetic Negative Generation**: **STRICTLY PROHIBITED**.

#### 3.3 Theoretical Framework: Positive-Unlabeled (PU) Risk Estimation
Using Elkan & Noto (2008) and du Plessis et al. (2014) Non-negative PU (nnPU) learning:
$$\mathcal{R}_{\text{pu}}(g) = \pi_p \mathcal{R}_p^+(g) + \max\left(0, \mathcal{R}_u^-(g) - \pi_p \mathcal{R}_p^-(g)\right)$$
Where $\pi_p = P(Y = 1)$ is the estimated class prior of SIF potential in offshore operations (empirically estimated at $\approx 0.18 - 0.22$ from industry literature).

#### 3.4 Model Candidates
1. **Model A (Baseline)**: Deterministic Energy-Barrier Safety Rule (Triggered if High Energy $\ge$ Threshold AND Barrier $\in \{\text{FAILED}, \text{ABSENT}\}$).
2. **Model B**: Two-Step Heuristic PU (Spy technique: identify confident negatives from $U$, train standard classifier).
3. **Model C**: Non-negative PU (nnPU) with Multi-Layer Perceptron on sentence embeddings.
4. **Model D**: Biased SVM / Ranking SVM optimizing for top-percentile recall.

#### 3.5 Split Strategy
- Stratified group-based train/validation/test split. Evaluation is performed on a curated held-out test partition verified by dual HSE consensus.

#### 3.6 Evaluation Metrics
- **Primary Metric**: **PR-AUC (Precision-Recall Area Under Curve)**.
- **Operational Ranking Metrics**: Recall@Top-10%, Recall@Top-20%, Normalized Discounted Cumulative Gain (NDCG@K).
- **Prohibited Metric**: Raw accuracy (meaningless under class imbalance).

#### 3.7 Baseline & Success Criteria
- **Baseline**: Deterministic safety rule. Expected PR-AUC: $\approx 0.71$.
- **Success Threshold**: nnPU candidate must achieve **$\text{PR-AUC} \ge 0.84$** and **$\text{Recall@Top-20\%} \ge 0.90$**.

---

### Experiment 4: Precursor Pattern Discovery & Dynamic Clustering

#### 4.1 Objective
Discover recurring, multi-dimensional failure patterns across **Site**, **Activity**, **Barrier Failure Mode**, and **Energy**, computing statistically defensible temporal trajectory indicators.

#### 4.2 Dataset & Cohort
- Entire canonical event set with verified narratives ($N = 559$ non-quarantined records).

#### 4.3 Clustering Pipeline
1. **Feature Construction**:
   - Dense semantic vectors from fine-tuned safety embedding model.
   - Categorical one-hot vectors for `location_facility`, `context_activity`, `energy_type`, and `iogp_rule`.
2. **Dimensionality Reduction**: UMAP (Uniform Manifold Approximation and Projection) tuned for density preservation.
3. **Density-Based Clustering**: HDBSCAN with `min_cluster_size = 3` and `min_samples = 2` (satisfying the support threshold $\ge 3$).

#### 4.4 Trend Classification Engine
For each discovered cluster $C$, calculate baseline rate $r_1$ and recent rate $r_2$ normalized by total reports:
- Test: Two-sided Poisson rate ratio test.
- Trajectory:
  - **`INCREASING`**: Rate ratio $> 1.25$ with $p < 0.05$.
  - **`DECREASING`**: Rate ratio $< 0.80$ with $p < 0.05$.
  - **`STABLE`**: Ratio between $0.80$ and $1.25$ or $p \ge 0.05$.
  - **`INSUFFICIENT_DATA`**: Total occurrences $< 3$.

#### 4.5 Evaluation Metrics & Baselines
- **Baseline**: Exact keyword co-occurrence grouping (e.g. Group by `Activity` $\times$ `Energy`).
- **Cluster Quality**: Silhouette Coefficient, Davies-Bouldin Index.
- **Domain Coherence**: Qualitative HSE review verifying that clustered incidents share a common physical failure mechanism (e.g., "diver gas supply contamination" or "temporary crane rental structural failure").

---

### Summary of Experimental Governance

| Experiment | Task Formulation | Primary Model Candidate | Baseline | Gate Metric Threshold |
| :--- | :--- | :--- | :--- | :--- |
| **Exp 1: IOGP Rules** | Multi-Label Classification | Fine-tuned DeBERTa-v3 Multi-Label | Regex with word boundaries | Macro F1 $\ge 0.78$ |
| **Exp 2: Hazard / Energy** | Token & Sequence Classification | DeBERTa-v3 NER + Span Extractor | Keyword lookup | Token F1 $\ge 0.82$, Substring $100\%$ |
| **Exp 3: SIF Ranking** | Positive-Unlabeled (PU) Learning | Non-negative PU (nnPU) | IOGP 4-Step Rule Gate | PR-AUC $\ge 0.84$ |
| **Exp 4: Clustering** | Unsupervised Pattern Discovery | UMAP + HDBSCAN | Exact categorical co-occurrence | Silhouette $\ge 0.45$, Support $\ge 3$ |
