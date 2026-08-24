<div align="center">

# IndusMind AI
### Industrial Decision Intelligence Platform

**ET AI Hackathon 2.0 — Problem Statement 8**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)](https://typescriptlang.org)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange?style=flat-square)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-green?style=flat-square)](https://supabase.com)

> *IndusMind AI doesn't just retrieve industrial knowledge — it understands it, connects it, explains it, predicts operational failures, and helps organizations make safer and better decisions.*

</div>

---

## The Problem

Industrial organizations store critical knowledge across thousands of documents — equipment manuals, SOPs, maintenance records, inspection reports, incident histories. This knowledge is:

- **Fragmented** across disconnected systems
- **Inaccessible** when engineers need it most  
- **Dependent** on individual expertise that retires with people
- **Reactive** — failures are discovered after they happen

**Result:** 35% of engineer time lost searching for information. 22% of downtime caused by knowledge fragmentation.

---

## The Solution

IndusMind AI answers the four questions every industrial operation needs:

| Question | Feature |
|---|---|
| **What happened?** | Incident Intelligence + Asset Timeline |
| **Why did it happen?** | Root Cause Analysis + AI Investigation Mode |
| **What will happen next?** | Failure Prediction Engine + Risk Intelligence |
| **What should we do?** | Decision Center + Operational Briefings |

---

## Architecture

```
Industrial Documents (PDF, DOCX, TXT)
            │
            ▼
┌─────────────────────────────────────┐
│      Knowledge Ingestion Engine     │
│  Parse → Chunk → Embed → Extract   │
│  Assets / Risks / Maintenance /     │
│  Incidents / Compliance / Entities  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│      Supabase PostgreSQL            │
│   pgvector (1536-dim embeddings)    │
│   Relational knowledge graph        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   Decision Intelligence Layer       │
│  RAG Copilot · Failure Prediction  │
│  Root Cause Analysis · Decisions   │
│  Investigation · Brief · Scenario  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│    Executive Command Center         │
│  Plant Health Index (A-F score)    │
│  Digital Twin · Knowledge Graph    │
└─────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---|---|
| 🧠 **Plant Health Index** | Weighted operational health score (A-F) across 5 dimensions |
| 🎯 **Decision Center** | AI-prioritized operational decisions with evidence and business impact |
| 🔍 **Investigation Mode** | Full AI expert report — reads all asset data, outputs root causes |
| ⚡ **Failure Prediction** | AI predicts failure probability with traceable evidence |
| 🔬 **Root Cause Analysis** | Multi-source reasoning across incidents and maintenance history |
| 💡 **AI Copilot** | RAG chat with source citations from your documents |
| 📋 **Operational Briefings** | Morning Brief, Weekly Report, Executive Summary, Critical Risk Report |
| 🌐 **Scenario Analysis** | "What if Boiler A shuts down?" — estimates operational impact |
| 🕸️ **Knowledge Graph** | Auto-extracted entity relationship visualization |
| 🏭 **Digital Twin** | Interactive asset hierarchy with complete operational profiles |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 15, TypeScript, Tailwind CSS |
| LLM Inference | Groq API (LLaMA 3.3 70B) — 10x faster than GPT-4 |
| Embeddings | OpenAI text-embedding-3-small (1536-dim) |
| Vector Store | Supabase pgvector (cosine similarity) |
| Database | Supabase PostgreSQL |
| Deployment | Vercel |

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/indusmind-ai
cd indusmind-ai
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Enable pgvector extension: Database → Extensions → search "vector" → enable
3. Open SQL Editor and run **in order**:
   - `supabase/schema.sql`
   - `supabase/schema_v2.sql`
   - `supabase/schema_v3.sql`

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...       # Free at console.groq.com
OPENAI_API_KEY=sk-...      # For embeddings only (~₹2 per 1M tokens)
```

### 4. Run

```bash
npm run dev
# Open http://localhost:3000
```

### 5. First Steps

1. Go to **Upload Docs** → upload any industrial PDF (boiler manual, safety SOP)
2. Wait 30-90 seconds for processing
3. Open **Command Center** → see Plant Health Index populate
4. Click **Investigate** → select an asset → watch AI analyze it
5. Try **Scenario Analysis** → "What happens if the boiler shuts down?"

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # Command Center
│   │   ├── investigate/          # AI Investigation Mode
│   │   ├── brief/                # Operational Briefings
│   │   ├── twin/                 # Digital Twin
│   │   ├── chat/                 # AI Copilot
│   │   ├── assets/               # Asset Intelligence
│   │   ├── risks/                # Risk Intelligence + RCA
│   │   ├── maintenance/          # Maintenance Intelligence
│   │   ├── incidents/            # Incident Intelligence
│   │   ├── compliance/           # Compliance Intelligence
│   │   ├── insights/             # AI Insights Feed
│   │   ├── graph/                # Knowledge Graph
│   │   └── documents/            # Document Management
│   ├── upload/                   # Document Upload
│   └── api/                      # 19 API route handlers
└── lib/
    ├── decision-engine.ts         # Plant Health, Decisions, Investigation, Scenario
    ├── intelligence.ts            # Entity/Asset/Risk/Incident/Compliance extraction
    ├── rag.ts                     # RAG retrieval pipeline
    ├── embeddings.ts              # OpenAI embeddings + text chunking
    ├── groq.ts                    # Groq client + entity extraction
    ├── parser.ts                  # PDF/DOCX/TXT text extraction
    ├── supabase.ts                # DB client + TypeScript types
    └── ai-types.ts                # Shared AI response type definitions
```

---

## How It Differs From Generic RAG

| Capability | Generic RAG / ChatGPT | IndusMind AI |
|---|---|---|
| Answer questions about documents | ✅ | ✅ |
| Extract structured entities | ❌ | ✅ |
| Asset-risk-incident relationship graph | ❌ | ✅ |
| Failure probability prediction | ❌ | ✅ |
| Evidence-grounded prioritized decisions | ❌ | ✅ |
| Plant-wide health scoring | ❌ | ✅ |
| What-if scenario simulation | ❌ | ✅ |
| Full AI investigation reports | ❌ | ✅ |

---

## Known Limitations

1. **No authentication** — demo-scope deployment; enterprise version requires auth layer
2. **Vercel 60s timeout** — very large PDFs (50+ pages) may timeout on free tier; use 10-20 page documents for demo
3. **Knowledge graph edges** — entity relationship edges require manual linking; auto-population planned
4. **Scanned PDFs** — text extraction requires selectable text; OCR not included
5. **Groq rate limits** — free tier is 30 req/min; demo should avoid simultaneous uploads

---

## Future Scope

- Multi-tenant authentication (Clerk/Auth.js)
- Real-time IoT sensor integration via WebSockets
- OCR for scanned legacy documents
- Automated compliance gap report generation
- Mobile app for field engineers
- Export to CMMS systems (SAP PM, IBM Maximo)
- Multi-language support (Hindi, regional languages)
- Voice interface for hands-free operations

---

## License

MIT License — built for ET AI Hackathon 2.0

---

<div align="center">
Built by <strong>Ammar Logade</strong> — M.H. Saboo Siddik College of Engineering, Mumbai<br>
B.E. Computer Science (AI & ML)
</div>
