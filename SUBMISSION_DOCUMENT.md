# IndusMind AI
## Detailed Submission Document
### ET AI Hackathon 2.0 | Problem Statement 8

---

## 1. Problem Statement

**PS8: AI for Industrial Knowledge Intelligence**

Industrial organizations face a critical operational challenge: critical knowledge is locked inside thousands of static documents — equipment manuals, standard operating procedures, maintenance records, inspection reports, compliance documents, and incident histories.

This knowledge fragmentation causes:
- **Reactive operations** — failures are discovered after they happen
- **Knowledge dependency** — critical expertise tied to individuals who retire
- **Decision delays** — engineers spend hours searching before they can act
- **Missed patterns** — incidents repeat because root causes aren't identified systematically

---

## 2. Solution Overview

**IndusMind AI** is an Industrial Decision Intelligence Platform that transforms fragmented operational documents into a unified, connected, actionable knowledge system.

The platform answers four questions every industrial operation needs:

| Question | How IndusMind AI Answers It |
|---|---|
| What happened? | Incident Intelligence + Asset Timeline |
| Why did it happen? | Root Cause Analysis + AI Investigation Mode |
| What will happen next? | Failure Prediction Engine + Risk Intelligence |
| What should we do? | Decision Center + Operational Briefings |

---

## 3. System Architecture

### Knowledge Ingestion Pipeline
When a document is uploaded, the system:
1. Extracts text from PDF/DOCX/TXT using pdf-parse and mammoth
2. Chunks text into 1,000-character overlapping segments
3. Generates vector embeddings using OpenAI text-embedding-3-small
4. Stores chunks in Supabase pgvector for semantic search
5. **Simultaneously** uses Groq LLaMA 3.3 70B to extract:
   - Physical assets (boilers, pumps, compressors, tanks)
   - Operational risks with severity classification
   - Maintenance activities and schedules
   - Incident records with root causes
   - Compliance requirements and gaps
   - Knowledge graph entities and relationships

### Intelligence Layer
- **RAG Copilot:** Semantic search + Groq inference with source citations
- **Failure Prediction:** AI analyzes incident history, maintenance status, and asset condition to predict failure probability with evidence
- **Root Cause Analysis:** Multi-source reasoning across incidents, maintenance, and documents
- **Decision Engine:** Synthesizes all modules to generate prioritized operational decisions
- **Scenario Analysis:** Simulates "what-if" situations across the operational context
- **Investigation Mode:** Full asset investigation reading all connected data
- **Plant Health Index:** Weighted score across 5 dimensions with trend detection

---

## 4. Key Features

### 4.1 Plant Health Index
A single weighted operational score (0-100, graded A-F) combining:
- Asset Health (30%) — failure probability, critical asset count
- Risk Status (25%) — open critical and high risks
- Maintenance (20%) — overdue activity ratio
- Compliance (15%) — non-compliant requirement ratio
- Incidents (10%) — open and critical incidents

### 4.2 Decision Center
AI generates 5-8 prioritized operational decisions, each containing:
- Priority level (critical/high/medium/low)
- Business impact description
- Root reasoning
- Confidence score
- Supporting evidence list
- Recommended actions
- Expected risk reduction

### 4.3 AI Investigation Mode
Select any asset → AI automatically reads all connected documents, incidents, maintenance records, and compliance items → generates expert report with executive summary, root causes with confidence, risk assessment, timeline narrative, and priority recommendations.

### 4.4 Failure Prediction Engine
Per-asset failure probability (0–100%) based on:
- Historical incident frequency and severity
- Maintenance overdue status
- Current risk classification
- Asset condition data
All predictions include human-readable evidence.

### 4.5 Operational Briefings
Automated reports: Morning Brief, Weekly Report, Executive Summary, Critical Risk Report — generated from live operational data, downloadable as text.

### 4.6 Scenario Analysis
Natural language what-if analysis: "What happens if Boiler A shuts down?" → operational impact, affected assets, safety implications, financial estimate, mitigation options.

---

## 5. Technical Differentiators

### Why This Is Not "ChatGPT for PDFs"

| Capability | Generic RAG | IndusMind AI |
|---|---|---|
| Semantic document search | ✅ | ✅ |
| Structured entity extraction | ❌ | ✅ |
| Asset-risk-incident relationship graph | ❌ | ✅ |
| Cross-document intelligence | ❌ | ✅ |
| Failure probability prediction | ❌ | ✅ |
| Evidence-grounded decisions | ❌ | ✅ |
| Plant-wide health scoring | ❌ | ✅ |
| What-if scenario simulation | ❌ | ✅ |

### Hallucination Mitigation
- All answers grounded in retrieved document chunks with similarity scores
- Structured data outputs always sourced from database records
- Confidence scores exposed to user on every prediction
- System explicitly states when data is insufficient

---

## 6. Technology Stack

| Component | Technology | Justification |
|---|---|---|
| Frontend + API | Next.js 15, TypeScript | Full-stack, server components, edge-ready |
| LLM Inference | Groq API (LLaMA 3.3 70B) | 10x faster than OpenAI, free tier for demos |
| Embeddings | OpenAI text-embedding-3-small | Best quality/cost, 1536-dim vectors |
| Vector Store | Supabase pgvector | No separate infra, cosine similarity search |
| Database | Supabase PostgreSQL | Relational data for all entities |
| PDF Parsing | pdf-parse, mammoth | Reliable text extraction |
| Deployment | Vercel | Zero-config CI/CD |

---

## 7. Business Value

**Target Users:**
- Process engineers and maintenance planners
- Safety and HSE officers
- Plant managers and operations directors
- Compliance and audit teams

**Value Delivered:**
- Reduce time-to-diagnosis from hours to minutes
- Identify failure risks before unplanned shutdowns
- Maintain institutional knowledge as engineers retire
- Streamline compliance documentation and gap detection
- Enable data-driven maintenance prioritization

**Scalability:**
- Stateless AI layer scales horizontally
- Multi-tenant data isolation via Supabase RLS
- Works with existing documents — no hardware integration required
- Per-plant SaaS licensing model

---

## 8. Demo Walkthrough

1. Upload industrial documents (PDF/DOCX) — manuals, SOPs, maintenance records
2. IndusMind AI automatically extracts knowledge and builds the operational graph
3. View Plant Health Index — single score across all operational dimensions
4. Generate AI Decisions — prioritized actions with evidence and business impact
5. Investigate an asset — AI reads all connected data and generates expert report
6. Run Scenario Analysis — simulate operational disruptions
7. Generate Morning Brief — executive briefing from live operational data

---

## 9. GitHub Repository

**Repository:** https://github.com/ammarlogade-max/indusmind-ai  
**Branch:** main  
**Setup Instructions:** README.md  

---

## 10. Team

**Developer:** Ammar Logade  
**Institution:** M.H. Saboo Siddik College of Engineering, Mumbai  
**Program:** B.E. Computer Science (AI & ML), Pre-Final Year  
**Stack:** Next.js · TypeScript · Python · Groq API · Supabase · OpenAI  

---

*Built for ET AI Hackathon 2.0 | Problem Statement 8: AI for Industrial Knowledge Intelligence*
