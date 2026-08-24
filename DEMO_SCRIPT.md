# IndusMind AI — Live Demo Script
**ET AI Hackathon 2.0 | 4 Minutes | Problem Statement 8**

---

## PRE-DEMO SETUP (Night Before — MANDATORY)

Upload these 5 free documents the night before. Do NOT upload live.

1. `OISD 116 boiler fire protection filetype:pdf` — oisd.nic.in
2. Any centrifugal pump maintenance manual (search Google)
3. `industrial safety SOP template filetype:pdf`
4. `pressure vessel inspection checklist filetype:pdf`
5. `factory act compliance checklist india filetype:pdf`

**Verify before sleeping:**
- All 5 show "Ready" in Documents page
- Assets page: at least 3-5 assets visible
- Risks page: at least 3-5 risks visible
- Knowledge Graph: nodes appear
- Dashboard: Plant Health Index shows a score
- Leave browser open at `/dashboard`

---

## 4-MINUTE DEMO SCRIPT

### [0:00–0:25] THE HOOK (no clicks)

> "Industrial plants run on knowledge — manuals, safety procedures, maintenance records. That knowledge is scattered. When a pump fails at 2am, no engineer can search 10,000 pages in real time. IndusMind AI transforms those documents into a connected operational brain."

**[Navigate to `/dashboard`]**

---

### [0:25–1:00] PLANT HEALTH INDEX

> "This is the Executive Command Center. The Plant Health Index — a single score for the entire plant, computed from assets, risks, maintenance, compliance, and incidents. We're at [SCORE]/100, Grade [GRADE]."

**[Point to 5 component bars]**

> "Each dimension is weighted. Entirely computed from structured extracted data — no AI guesswork, fully auditable."

---

### [1:00–1:35] DECISION CENTER

**[Click "Generate"]** ← 5-10 second wait

> "Now I'm asking the AI what we should actually do."

**[Expand top priority decision]**

> "Each decision has a confidence score, business impact, and evidence. The AI doesn't just say 'high risk' — it shows which incidents and maintenance records drove this conclusion."

---

### [1:35–2:30] INVESTIGATION MODE

**[Click Investigate → select best asset]** ← 8-15 second wait

> "Investigation Mode. The AI reads every incident, every maintenance record, every linked document for this asset. Like assigning an expert engineer."

**[When report appears]**

> "Executive Summary. Root causes with confidence and evidence. Recommendations with timelines. 12 seconds. A human engineer needs hours."

---

### [2:30–3:00] SCENARIO ANALYSIS

**[Back to Dashboard → type in scenario box:]**
`What happens if the main boiler shuts down?`

**[Click Analyze]** ← 5-8 second wait

> "What-if analysis against actual plant data."

**[Point to result]**

> "Operational impact, safety implications, financial estimate, mitigations."

---

### [3:00–3:35] OPERATIONAL BRIEF

**[Briefings → Morning Brief → Generate]** ← 5-10 second wait

> "Every morning, managers need a briefing. AI-generated from live operational data."

**[Show result briefly, click Download]**

---

### [3:35–4:00] CLOSE

**[Back to `/dashboard`]**

> "Documents in — operational intelligence out. IndusMind AI doesn't just retrieve industrial knowledge. It understands it. Connects it. Explains it. Predicts failures. And helps organizations make faster, safer, better decisions. Thank you."

---

## BACKUP PLANS

**Groq slow (>15s):** "LLaMA 3.3 70B reasoning through operational data..." → show Knowledge Graph while waiting

**Investigation returns "insufficient data":** Click a different asset with more history

**Rate limit (429):** Wait 60s, show Documents/Graph pages (no AI calls needed)

**Internet down:** Show pre-taken screenshots, narrate exactly as scripted

**Browser crash:** Ctrl+Shift+T, navigate to `/dashboard`, continue

---

## TIMING REFERENCE

| Mark | Action |
|------|--------|
| 0:00 | Begin talking |
| 0:25 | Navigate to dashboard, explain Health Index |
| 1:00 | Click Generate Decisions |
| 1:35 | Navigate to Investigation Mode, select asset |
| 2:30 | Back to Dashboard, run Scenario Analysis |
| 3:00 | Navigate to Briefings, generate Morning Brief |
| 3:35 | Back to dashboard, closing |
| 4:00 | Done |

---

## Q&A ONE-LINERS

| Question | Answer |
|----------|--------|
| "Different from ChatGPT?" | "ChatGPT retrieves text. We extract structured operational knowledge as database records and reason across them." |
| "Why not Microsoft Copilot?" | "Copilot is a document assistant. We're an operational intelligence platform — failure prediction and prioritized decisions aren't possible with Copilot." |
| "Hallucinations?" | "Every answer cites source chunks. When data is insufficient we say so. Confidence scores make uncertainty visible." |
| "Production ready?" | "Production-quality architecture. Would need auth and rate limiting for enterprise. The AI pipeline is production-grade." |
| "Scale?" | "Stateless AI, Supabase scales horizontally. Multi-tenant with one additional FK column." |
