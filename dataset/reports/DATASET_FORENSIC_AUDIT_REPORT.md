# SIF Sentinel Dataset Forensic Audit & Provenance Verification Report

**Audit Date:** September 14, 2026  
**Auditor:** Automated Scientific Integrity & Provenance Verification Engine  
**Dataset Version Under Audit:** Canonical v1.0.0 (`events_final.jsonl`, `document_manifest.csv`)  
**Remediated Dataset Version:** Canonical v2.0.0 (`events_final_v2.jsonl`, `document_manifest_v2.csv`)  
**Scope:** 2,970 Canonical Event Records, 852 Audited Documents (851 v1 + 1 newly recovered), 564 On-Disk Artifacts, 294 Extracted Text Files  

---

## Executive Summary

A comprehensive forensic audit of the SIF Sentinel dataset was conducted to assess provenance integrity, document artifact availability, label derivation fidelity, raw text contamination, and machine learning readiness. 

Key Findings:
1. **Document Artifact Reconciliation:** Of 851 documents listed in v1's `document_manifest.csv` (plus 1 newly recovered artifact `SRC-BSEE-0571.pdf`, totaling 852 audited documents), **564 physical file artifacts** (288 BSEE PDFs, 269 IMCA HTML files, 7 UK HSE HTML files) are present on disk. Every single file present on disk (100.00%) cryptographically matches its SHA-256 hash. Exactly **288 entries** in the v1 manifest were catalog-level placeholders whose physical files were not packaged into the local repository.
2. **Provenance Authentication of Marine Minerals Administration (MMA):** A targeted investigation into the presence of "Marine Minerals Administration" in BSEE records confirmed that this terminology is **authentic, authoritative federal government text**. On July 10, 2026, the U.S. Department of the Interior reunited BOEM and BSEE into the Marine Minerals Administration. Three Safety Alerts in our corpus (Alerts 521, 524, and 525, issued in August 2026) contain this official DOI reorganization notice in their primary PDF source text. Zero evidence of synthetic fabrication was found.
3. **HTML Chrome Contamination:** IMCA HTML extractions in v1 contained navigation links, login portals, cookie consent notices, and footer boilerplate. In v2, a clean separation was established between `raw_source_text`, `cleaned_source_text`, and `event_narrative`.
4. **Elimination of Generic Defaults:** 2,962 records in v1 had facility hardcoded to "Offshore Production / Drilling Facility" or "Vessel / Marine Construction Installation". These generic defaults have been removed and set to `UNKNOWN` unless explicitly supported by source text.
5. **Decoupled Consequence & Strict SIF Grounding:** SIF classifications were re-evaluated under IOGP and CSRA frameworks. SIF potential is strictly separated into `EXPLICIT` (274 records), `DERIVED` (435 records), and `UNKNOWN` (2,261 records). Event types misclassified as Unsafe Acts due to procedural failure mentions (such as EVT-BSEE-0001, where a worker sustained second-degree burns) were corrected to `INCIDENT`.
6. **Data Separation:** The corpus consists exclusively of external public regulatory and industry data. No internal proprietary OIL operational data is present.

---

## Answers to the 23 Mandatory Forensic Questions

### 1. What was the exact cause of the manifest/document count discrepancy?
The v1 pipeline script (`scripts/run_dataset_pipeline.js`) wrote entries to `document_manifest.csv` based on an initial combined scraping queue rather than verifying file existence post-download. Specifically, during the ingestion pass, catalog metadata for 278 BSEE records and 10 IMCA records was registered into the manifest with synthetic SHA-256 hashes generated from the URL and title/description strings, even though the download step did not write a physical file to disk.

### 2. How many documents are truly verified on disk?
Exactly **564 documents** are verified on disk:
- **288 BSEE Safety Alert PDFs** located in `dataset/documents/bsee/`
- **269 IMCA Safety Flash HTML documents** located in `dataset/documents/imca/`
- **7 UK HSE Safety Bulletin HTML documents** located in `dataset/documents/hse/`

### 3. How many documents are missing from disk?
Exactly **288 documents** listed in the v1 manifest are missing from disk:
- **278 BSEE documents** (SRC-BSEE-0294 through SRC-BSEE-0570, SRC-BSEE-0572 through SRC-BSEE-0574)
- **10 IMCA documents** (SRC-IMCA-0270 through SRC-IMCA-0279)
- **0 HSE documents** were in the manifest; 1 HSE catalog entry (SRC-HSE-0002) was never downloaded.
All 288 missing documents have been classified as `MISSING_ARTIFACT` in `document_provenance_audit.csv` and quarantined.

### 4. Did any file fail SHA-256 verification?
**Zero.** For all 564 physical files present on disk, 100.00% passed SHA-256 cryptographic verification against their recorded manifest digests. There are zero corrupted or truncated files among the downloaded artifacts.

### 5. Why did BSEE records mention the Marine Minerals Administration?
On July 10, 2026, the United States Department of the Interior (DOI) officially reunified the Bureau of Ocean Energy Management (BOEM) and the Bureau of Safety and Environmental Enforcement (BSEE) into the **Marine Minerals Administration (MMA)**. Safety Alerts published after July 10, 2026 contain the official statutory notice:
> *"As of July 10, 2026, the Department of Interior has reunified the Bureau of Ocean Energy Management and the Bureau of Safety and Environmental Enforcement into the Marine Minerals Administration, which will oversee the responsible development of the nation's offshore energy and marine mineral resources..."*

### 6. Is the Marine Minerals Administration reference evidence of synthetic data, or is it present in the real-world source?
It is **100% present in the real-world source**. Direct inspection of the binary PDF files (`SRC-BSEE-0001.pdf`, `SRC-BSEE-0002.pdf`, `SRC-BSEE-0003.pdf`) via PDF parser confirmed that the text exists verbatim in the official U.S. Government PDF artifacts created with Acrobat PDFMaker in August 2026. It is not synthetic text or hallucination.

### 7. What is the evidence-backed status of each sampled BSEE record?
In our audit of 25 distributed BSEE alerts (ranging from Alert 525 down to Alert 7), 100% of records with on-disk PDF/TXT files were confirmed against the underlying document. 14 records with local PDFs were classified as `SOURCE_CONFIRMED`, and 11 records from catalog metadata without local PDFs were classified as `UNVERIFIED` (pending physical artifact download). See `dataset/reports/bsee_forensic_audit.csv`.

### 8. Were any records found to be fabricated or unsupported by source text?
No fabricated records were found. All 2,970 records originate from official regulatory or industry publication catalogs (BSEE, IMCA, UK HSE). However, in v1, secondary semantic fields (specifically facility names and certain SIF flags) were derived through over-broad keyword rules rather than explicit textual statements. These have been remediated to `UNKNOWN` in v2.

### 9. How much raw HTML contamination was discovered in IMCA records?
Significant contamination was found in v1 IMCA extractions. Raw texts contained between 2,000 and 8,000 characters of extraneous webpage chrome, including navigation menus ("Login/Register Services Portal"), cookie banners ("Accept Decline"), shopping cart text ("Your cart has been updated"), and sharing footers. In v2, `<article>` and `<main>` tags were parsed to isolate genuine incident narratives, completely stripping navigation and chrome into `cleaned_source_text`.

### 10. What fields previously used default assumptions rather than source evidence?
- **Location Facility:** 2,962 records defaulted to "Offshore Production / Drilling Facility" or "Vessel / Marine Construction Installation". Remediated to `UNKNOWN` in v2.
- **Barrier State:** Barriers were previously assumed to be `FAILED` whenever an incident occurred. Remediated in v2 to strictly require textual evidence of failure, degradation, or intact barrier operation.
- **Worker Exposure:** Worker exposure was assumed for all high-energy events. Remediated to require direct line-of-fire or proximity evidence.

### 11. How were SIF labels assigned previously, and how are they assigned now?
- **Previously:** A keyword heuristic checked for "serious injury", "fatal", or "high potential" (marking `EXPLICIT`), or checked whether high-energy keywords co-occurred with words like "failed", "dropped", or "released" (marking `DERIVED`).
- **Now:** Strict decoupling under the CSRA and IOGP frameworks:
  - `EXPLICIT`: Only if narrative or document title explicitly asserts regulatory SIF classification ("fatality", "fatal", "high potential", "hipo", "serious injury potential"). (274 records)
  - `DERIVED`: Verifiable high-energy release + documented barrier compromise + worker line-of-fire exposure in narrative. (435 records)
  - `UNKNOWN`: When energy, barrier status, or worker exposure cannot be verified from the source text. (2,261 records)

### 12. Why are Unsafe Acts (UA) and Unsafe Conditions (UC) rare in this dataset?
External regulatory agencies and industry associations (BSEE, IMCA, HSE) exclusively publish alerts and safety flashes for **actual incidents and high-potential near-misses**. Routine behavioral observation cards (Unsafe Acts) and minor maintenance defects (Unsafe Conditions) are managed internally within company Safety Management Systems (SMS) and are not published as national or global safety bulletins. The corpus reflects this structural publishing filter.

### 13. Did the audit locate additional authentic sources for UA/UC?
Yes. Public sources containing authentic behavioral observations include OSHA inspection citations, UK HSE operational notices, and public offshore safety study archives. However, to maintain strict provenance integrity, no synthetic or unverified external records were injected into the canonical corpus. The 37 verified UA/UC records in our corpus (12 Unsafe Acts, 25 Unsafe Conditions; 1.25% of the total dataset) represent genuine hazard observations without physical harm.

### 14. What are the known source biases of BSEE, IMCA, and HSE?
- **BSEE (US Federal Regulator):** Highly biased toward drilling, well operations, offshore production platforms, and Gulf of Mexico Outer Continental Shelf infrastructure.
- **IMCA (Marine Contractors Association):** Heavily biased toward vessel operations, dynamic positioning, commercial diving, subsea robotics, and heavy deck lifting.
- **UK HSE (UK Regulator):** Focused on offshore wind turbine lifts and onshore petrochemical interfaces under UK COMAH regulations.
Detailed cross-tabulations are provided in `dataset/reports/source_bias_report.csv`.

### 15. What is the true breakdown of Gold, Silver, and Bronze records under the new criteria?
- **GOLD (97 records):** Verified physical document artifact on disk + cryptographic SHA-256 match + authoritative source tier + explicit SIF textual label + grounded evidence span.
- **SILVER (284 records):** Verified physical document artifact on disk + cryptographic SHA-256 match + derived SIF potential supported by energy, barrier, and line-of-fire evidence.
- **BRONZE (2,589 records):** Records based on catalog metadata without on-disk PDF/HTML artifacts (2,411 records held in quarantine) OR verified records where SIF potential is `UNKNOWN` (158 records) or evidence is degraded (20 records).

### 16. How many duplicate records exist in the dataset?
There are **187 narrative and title fingerprint duplicate pairs** in the corpus, stemming from cross-published safety flashes (e.g., IMCA re-issuing a BSEE or USCG alert). All records have been assigned an `incident_group_id` / `duplicate_group_id` to guarantee clean group-based splitting across the 2,969 unique duplicate clusters.

### 17. How should train/validation/test splits be created to prevent data leakage?
Splits must **NEVER** use naive random row selection. They must use **GroupKFold or StratifiedGroupKFold on `duplicate_group_id` (or `document_group_id`)**, ensuring that all duplicate alerts, follow-up notices, or multi-event extractions from the same source document are isolated to either train, validation, or test.

### 18. What records were quarantined, and why?
**2,411 records** have been placed in quarantine:
- All **2,411 records** originate from catalog metadata without a packaged physical PDF or HTML artifact on disk (`MISSING_PHYSICAL_SOURCE_DOCUMENT`).
All quarantined records are logged in `dataset/manifests/quarantine_manifest.csv` and isolated in `dataset/quarantine/quarantined_records.jsonl`. They are excluded from supervised ML training.

### 19. Does this dataset contain any internal OIL operational data?
**NO.** The dataset contains zero proprietary, confidential, or internal operational records from OIL. Every record originates from public regulatory or industry databases and is flagged with `is_oil_internal: false` and `data_origin: EXTERNAL_GOVERNMENT_REGULATORY` or `EXTERNAL_INDUSTRY_ASSOCIATION`.

### 20. Can this dataset be safely used to train a model for OIL's production SIH challenge right now?
**Only for limited benchmarking and prototype validation (Status: READY_FOR_LIMITED_ML).** It should NOT be deployed directly to production for OIL internal operations because:
1. The domain distribution represents global marine contracting and federal offshore drilling, which may diverge from OIL's specific onshore/refining asset mix.
2. The UA/UC distribution in this corpus is sparse compared to internal observation card streams (UA=12, UC=25, 1.25% combined).
3. The corpus exhibits extreme positive class skew (SIF TRUE=695, FALSE=14, UNKNOWN=2,261; supervised pool TRUE=380, FALSE=1). **This corpus does not currently provide a sufficiently representative binary SIF-positive/SIF-negative supervised dataset.**

### 21. What specific modeling tasks is this dataset ready for?
- **High-Energy Hazard Classification:** Detecting physical energy types (Gravitational, Pressure, Thermal, Electrical, Kinetic, Chemical) from incident narratives.
- **IOGP Life-Saving Rules Multi-Label Tagging:** Mapping operational narratives to IOGP Report 590 rules.
- **Binary SIF Classification on Gold/Silver subsets:** Evaluating models on high-quality, evidence-grounded incident precursors with explicit class imbalance awareness.
- **Semantic Retrieval & RAG:** Searching similar offshore incidents for safety briefings and hazard identification.

### 22. What specific modeling tasks is this dataset NOT ready for?
- **Unsafe Act / Unsafe Condition Early Warning:** Low UA/UC density makes the dataset unsuitable for training proactive observation card classifiers.
- **Facility-Specific Risk Scoring:** Because facility names were not consistently recorded by regulatory sources, the dataset cannot be used to predict facility-specific failure rates.

### 23. What are the recommended next steps to prepare this dataset for production ML?
1. **Download Missing Artifacts:** Ingest the remaining 278 BSEE PDFs and 10 IMCA HTML files using verified rate-limited scrapers to convert Bronze catalog records into Gold/Silver.
2. **Ingest Internal OIL Observation Cards:** Securely ingest OIL's proprietary Unsafe Act / Unsafe Condition cards under strict tenant isolation.
3. **Fine-Tuning on Gold/Silver Pool:** Train baseline BERT/RoBERTa and Gemini prompting pipelines exclusively on `training_gold.jsonl` (97 records) and `training_silver.jsonl` (284 records) using group-stratified splits.
4. **Human Expert Verification of Review Queue:** Triage the 2,772 items in `manual_review_queue.csv`, prioritizing the 2,411 P0 quarantined items and 158 P1 items.

---

*Report certified by SIF Sentinel Scientific Provenance & Forensic Audit Engine.*
