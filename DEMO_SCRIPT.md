# SIF Sentinel — 4-Minute High-Impact SIH Demonstration Script
**Problem Statement ID:** 26165 | **Oil India Limited**

---

### Step 1: Context & Core Problem (0:00 – 0:45)
- **Visual:** Open `/dashboard` (Command Center).
- **Speaker:**
  > "Respected judges, Oil India Limited collects thousands of safety reports each month. Over 90% are low-risk housekeeping issues, but buried inside are the 5% that lead to blowouts, structural collapses, and fatal falls. Currently, these reports are triaged manually weeks or months later.
  > 
  > SIF Sentinel solves Problem Statement 26165 by providing continuous Critical Barrier Intelligence. We ingest free-text observations across Unsafe Acts, Unsafe Conditions, Near-Misses, and Historical Incidents, automatically classify SIF potential, map them to IOGP Life-Saving Rules, and surface where safety barriers are failing before a catastrophic loss occurs."

---

### Step 2: Site & Activity Density Ranking (0:45 – 1:30)
- **Visual:** Navigate to `/dashboard/density`. Sort by Precursor Density.
- **Speaker:**
  > "Here is the core mandatory requirement of the Problem Statement: exact mathematical ranking of sites and activities by SIF precursor density. Notice we don't use arbitrary 'safety scores' or opaque black-box indices.
  > 
  > At Duliajan Rig 7, the precursor density is 48.0%, dominated by Working at Height and Energy Isolation failures. Notice our activity ranking immediately highlights Rig Mast Maintenance as the primary high-hazard task. This provides the HSE Director with an unequivocal, evidence-based priority list for tomorrow morning's site inspections."

---

### Step 3: Multi-Dimensional Precursor Patterns & SIF Pathways (1:30 – 2:30)
- **Visual:** Navigate to `/dashboard/patterns`, click into an active precursor cluster. Show SIF Pathway.
- **Speaker:**
  > "Here is our core innovation: Critical Barrier Intelligence. Individual reports often appear innocuous in isolation. Over the past 14 days, four separate observations looked routine: a minor gas leak, a permit delay, a missing fire watch, and hot cutting on a manifold.
  > 
  > SIF Sentinel connected them across Activity, Location, and Barrier Failure into an Escalating Hot Work Precursor Storm. Our SIF Pathway visualizer reconstructs the exact chain of failure: Flammable Hydrocarbon Hazard → High Thermal Energy → Absence of Verified Gas Testing → Personnel in Release Envelope. We don't guess accident timing with a crystal ball; we detect when the barriers preventing an accident are collapsing."

---

### Step 4: Closed-Loop CAPA & Post-Closure Recurrence (2:30 – 3:15)
- **Visual:** Navigate to `/dashboard/actions`. Show the CAPA register and recurrence badge.
- **Speaker:**
  > "Conventional safety software stops once a corrective action is marked 'Completed' in a spreadsheet. SIF Sentinel enforces the Hierarchy of Controls—prioritizing engineered direct barriers over weak warnings.
  > 
  > Even more critically, we initiate a continuous 30-day surveillance window following closure. If the same precursor recurs at that rig, our system flags 'Post-Closure Recurrence Detected', holding supervisors accountable for genuine risk reduction."

---

### Step 5: Transparency, Offline Execution & Audit Integrity (3:15 – 4:00)
- **Visual:** Open `/dashboard/models` and `/dashboard/audit`. Click "Verify Ledger Integrity".
- **Speaker:**
  > "SIF Sentinel operates on a deterministic, low-latency (<50ms) NLP model running 100% on local CPU with zero external API dependencies for core safety scoring. Every alert provides transparent positive and negative n-gram feature attribution.
  > 
  > Finally, every classification, reviewer override, and CAPA milestone is sealed into a tamper-evident SHA-256 cryptographic hash chain, providing Oil India Limited with a regulator-ready, legally defensible audit ledger. Thank you."
