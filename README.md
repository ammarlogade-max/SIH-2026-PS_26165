<div align="center">

# SIF Sentinel
### Critical Barrier Intelligence for Serious-Injury & Fatality (SIF) Prevention

**Smart India Hackathon 2026 — Problem Statement ID: 26165**  
**Organization:** Oil India Limited (OIL) | **Category:** Software | **Theme:** Smart Automation

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square)](https://tailwindcss.com)
[![IOGP Life-Saving Rules](https://img.shields.io/badge/IOGP-Report_459-green?style=flat-square)](https://www.iogp.org)

> *"We don't predict accidents. We detect when the critical barriers preventing them are failing."*

</div>

---

> [!NOTE]
> **Dataset Status:** The current embedded benchmark dataset contains ~180 curated development records (~50% SIF / 50% non-SIF) for pipeline verification. It is a **synthetic/curated development fixture**, NOT production Oil India Limited historical data. Real-world SIF precursor prevalence typically ranges between 2% and 8%. Full model calibration and blind holdout validation will occur upon ingestion of the external operational dataset.

---

## 1. Problem Statement Overview (SIH26165)

Oil India Limited (OIL) collects large volumes of Unsafe-Act / Unsafe-Condition (UA/UC) observations, near-miss reports, and incident logs through its HSSE reporting mechanisms. Currently, these reports are triaged manually after arbitrary intervals (monthly, quarterly), which delays critical intervention.

Industry best practice (Campbell Institute, EEI SCL, IOGP) establishes that **low-severity incidents do not share the same root causes as fatalities**. Minor slips and trips are common, but fatalities occur when **high-energy hazards meet compromised critical barriers**.

### Mandatory SIH26165 Requirements Satisfied:
1. **Ingestion of free-text safety reports:** Unsafe Acts (UA), Unsafe Conditions (UC), Near-Misses, and Historical Incidents.
2. **Automated SIF-Potential Classification:** High-recall binary classification separating high-energy fatal precursors from routine housekeeping noise.
3. **IOGP Life-Saving Rule Mapping:** Automated multi-label mapping to the 9 global IOGP Life-Saving Rules (Report 459).
4. **Multi-Dimensional Recurring Precursor Detection:** Pattern clustering across **activity**, **location**, **barrier failure**, and **time window**.
5. **Interactive Safety Dashboard:** Real-time visibility into high-hazard operational zones.
6. **Site & Activity SIF-Precursor Density Ranking:** Transparent mathematical density ranking: $\frac{\text{SIF Precursors}}{\text{Total Reports}} \times 100\%$.
7. **HSE Intervention Prioritization:** Actionable closed-loop Corrective Action (CAPA) tracking with post-closure recurrence monitoring.

---

## 2. Core Architecture: SIF Sentinel

```
                      OIL SAFETY OBSERVATIONS
              (UA / UC / Near-Miss / Historical Incidents)
                                 │
                                 ▼
                     CANONICAL EVENT INGESTION
             - Preserves Raw Text (Immutable Source)
             - Generates Normalized Text
             - Preserves Historical Event Timestamps
                                 │
                                 ▼
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     [ SIF CLASSIFIER ]   [ IOGP MAPPER ]   [ ENTITY EXTRACTION ]
     - Calibrated Prob.   - 9 IOGP Rules    - Energy Category
     - Review Zone Gate   - Multi-Label     - Barrier State
     - N-gram Evidence    - Evidence Span   - Worker Exposure
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 ▼
                      SIF PATHWAY ENGINE
            Hazard → Energy → Critical Barrier → Exposure → SIF
                                 │
                                 ▼
                 TEMPORAL PRECURSOR ENGINE
       - Clusters: Site + Activity + Barrier + Time Window
       - Trajectory: Isolated | Recurring | Escalating
       - Recurrence Monitoring: Post-CAPA Surveillance
                                 │
                                 ▼
                 HSE RISK PRIORITIZATION
       - Site SIF Precursor Density Ranking
       - Activity SIF Precursor Density Ranking
       - Closed-Loop CAPA with Hierarchy of Controls
       - Tamper-Evident SHA-256 Chained Audit Ledger
```

---

## 3. Key Functional Innovations

### A. Independent Critical Barrier Intelligence
Conventional tools assume that SIF classification automatically implies barrier failure. SIF Sentinel decouples the two:
- **Hazard & Energy Analysis:** 10 energy categories (CSRA Energy Wheel) evaluated with high-energy thresholding.
- **Barrier Condition Evaluation:** Independent extraction of barrier status (`EFFECTIVE`, `DEGRADED`, `FAILED`, `MISSING`, `UNKNOWN`).
- **Exposure State:** Verifies whether personnel intersected the lethal release envelope or line-of-fire.

### B. Multi-Dimensional Precursor Pattern Detection
Instead of naive `site + rule >= 2` clustering, SIF Sentinel groups observations across:
- **Facility / Asset** (e.g., Duliajan Rig 7)
- **Operational Activity** (e.g., Rig Mast Maintenance)
- **Specific Location** (e.g., Elevated Grating at 12m)
- **Compromised Critical Barrier** (e.g., Fall Arrest Inertia Reel)
- **Rolling Time Window** (14-day and 30-day temporal windows)

### C. Closed-Loop CAPA & Post-Closure Recurrence
When an action is closed, SIF Sentinel begins an automated 30-day surveillance window. If a matching precursor recurs at that location or activity, the CAPA is flagged as **"Ineffective — Post-Closure Recurrence Detected"**, alerting HSE leadership.

### D. Tamper-Evident Chained Audit Ledger
Every report ingestion, AI classification, HSE override, and CAPA state transition is sealed in a cryptographic hash chain ($\text{Hash}_n = \text{SHA256}(\text{Record}_n + \text{Hash}_{n-1})$). Any retroactive tampering invalidates the verification chain.

---

## 4. Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Installation
```bash
git clone <repo-url>
cd sif-sentinel
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## 5. Directory Structure

```
src/
├── app/
│   ├── api/             # API routes (reports, aggregates, patterns, actions, audit, pathways)
│   ├── dashboard/       # Interactive Next.js Dashboard pages
│   │   ├── density/     # Site & Activity Precursor Density ranking
│   │   ├── patterns/    # Multi-dimensional precursor pattern explorer
│   │   ├── pathways/    # SIF pathway graph visualizer
│   │   ├── reports/     # Raw report intelligence & HSE review
│   │   ├── actions/     # Closed-loop CAPA register
│   │   ├── rules/       # IOGP Life-Saving Rules breakdown
│   │   ├── models/      # Transparent model evaluation suite
│   │   └── audit/       # Tamper-evident chained audit ledger
├── components/          # Reusable UI & Safety-science visualizers
└── lib/
    ├── types.ts                 # Canonical domain models & interfaces
    ├── layer-a-classifier.ts    # Deterministic TF-IDF + LogReg classifier
    ├── safety-science-engine.ts # Decoupled Energy & Barrier analysis
    ├── aggregation-engine.ts    # Density ranking & temporal clustering
    ├── safety-store.ts          # In-memory + local file / Supabase store
    └── benchmark-seeder.ts      # Curated development benchmark fixture
```

---

## 6. License & Disclaimer
Built for the **Smart India Hackathon 2026** for **Oil India Limited (OIL)** under Problem Statement 26165.  
*All safety terminology aligns with IOGP Report 459, Campbell Institute SIF research, and OISD safety standards.*
