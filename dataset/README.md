# SIF Sentinel Canonical Safety Event Dataset

## Overview
This repository contains the verified canonical safety event dataset compiled for **SIF Sentinel (SIH26165)**, designed to support machine learning and causal safety science evaluation without synthetic data contamination.

Every record in this dataset is sourced from real, verifiable primary public records from authoritative offshore regulatory agencies and international industry bodies. **Zero records were synthesized or fabricated.**

---

## Data Provenance & Authoritative Sources
1. **Bureau of Safety and Environmental Enforcement (BSEE)**:
   - **Tier**: Tier A (Authoritative Government Regulator)
   - **Jurisdiction**: US Federal Outer Continental Shelf
   - **Records**: 581 safety alerts covering drilling, offshore production, crane operations, dropped objects, pressure systems, and high potential near misses.
   - **Verification**: Direct PDF download and cryptographic SHA-256 validation.

2. **International Marine Contractors Association (IMCA)**:
   - **Tier**: Tier B (Recognized Global Industry Safety Body)
   - **Jurisdiction**: International Marine and Offshore Contracting
   - **Records**: 2,401 safety flashes covering marine operations, dynamic positioning, diving, lifting & rigging, pressure systems, and IOGP Life-Saving Rules.
   - **Verification**: Official RSS publication records and HTML article acquisition with SHA-256 hashing.

3. **Health and Safety Executive (UK HSE)**:
   - **Tier**: Tier A (Authoritative Government Regulator)
   - **Jurisdiction**: United Kingdom Offshore & Petrochemical
   - **Records**: Offshore grating, H2S hazard, and pressure system safety bulletins.
   - **Verification**: Official bulletin acquisition with SHA-256 hashing.

---

## Dataset Directory Structure
```text
dataset/
├── documents/               # Verified primary source documents (PDFs & HTML)
│   ├── bsee/               # Downloaded BSEE investigation PDFs (e.g., SRC-BSEE-0001.pdf)
│   ├── imca/               # Downloaded IMCA safety flash HTML documents
│   └── hse/                # Downloaded UK HSE regulatory safety bulletins
├── extracted/              # Extracted plain text representations for text analysis
│   └── bsee/               # Plain text extracted via pdf-parse
├── raw/                    # Raw catalog JSON indexes from origin feeds
│   ├── bsee_catalog.json
│   ├── imca_catalog.json
│   └── hse_catalog.json
├── final/                  # Production-ready canonical datasets
│   ├── events_final.jsonl  # JSON Lines format matching canonical schema
│   └── events_final.csv    # Flat CSV format with all core fields and provenance
├── manifests/              # Audit and traceability manifests
│   ├── source_manifest.csv      # Registry of origin bodies, tiers, and base URLs
│   ├── document_manifest.csv    # Primary document SHA-256 hashes and URLs
│   └── deduplication_report.csv # Audit trail of deduplication and canonical matching
├── reports/                # Quality assurance and statistical reports
│   ├── validation_report.json   # 100% Ajv JSON Schema conformance report
│   ├── quality_report.csv       # Field-level completeness and quality tier flags
│   └── dataset_statistics.json  # Comprehensive distribution breakdown
└── schema/
    └── safety_event.schema.json # Canonical formal JSON Schema (Draft 2020-12)
```

---

## Schema Adherence & Key Fields
Every event record strictly implements `dataset/schema/safety_event.schema.json`:
- `event_id`: Unique identifier (e.g., `EVT-BSEE-0042`, `EVT-IMCA-0112`)
- `event_type`: Canonical categorization (`INCIDENT`, `NEAR_MISS`, `UA`, `UC`)
- `source`: Verified source organization, document ID, title, URL, tier, and page
- `narrative`: Raw verbatim text, normalized text, and source excerpt
- `energy`: High-energy classification (`GRAVITATIONAL`, `PRESSURE`, `THERMAL`, `ELECTRICAL`, `KINETIC`, `CHEMICAL`) with exact textual evidence
- `barriers`: Critical barrier objects with observed states (`EFFECTIVE`, `DEGRADED`, `FAILED`, `MISSING`, `UNKNOWN`) and evidence
- `sif`: SIF potential (`TRUE`, `FALSE`, `UNKNOWN`), label type (`EXPLICIT`, `DERIVED`, `UNKNOWN`), and evidence quote
- `iogp`: Mapped IOGP Life-Saving Rules (Rules 01 through 09)
- `consequence`: Strict separation of actual consequence vs. potential consequence
- `quality`: Quality tiering (`GOLD`, `SILVER`, `BRONZE`) based on data completeness
- `provenance`: Cryptographic SHA-256 document hash, access date, origin, and extraction method

---

## Quality Gates & Verification
1. **Zero Synthetic Records**: 100% of records originate from official regulatory or industry publications.
2. **Provenance Traceability**: Every record contains an immutable SHA-256 hash and verifiable origin URL.
3. **Schema Conformance**: 100% of final records pass Ajv JSON Schema validation with zero errors.
4. **Decoupled Consequence**: Actual consequences are strictly separated from potential consequences to prevent model bias.
