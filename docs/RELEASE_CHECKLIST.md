# IndusMind AI — Release Checklist
**Version:** RC2-Approved  
**Release Manager:** _______________  
**Date:** _______________

---

## PRE-RELEASE VERIFICATION

### Code
- [x] TypeScript: zero errors (`npx tsc --noEmit`)
- [x] All API routes have try/catch
- [x] All client loading flags have finally blocks
- [x] No unguarded fetch calls in UI
- [x] Error boundaries present (error.tsx, dashboard/error.tsx)
- [x] not-found.tsx present
- [x] os.tmpdir() used for file uploads (Vercel-compatible)
- [x] OpenAI client uses lazy initialization
- [x] Groq JSON parser handles preamble
- [x] Insights use upsert (no duplicate constraint violations)
- [x] Async file reads (no sync blocking)
- [x] Sequential uploadAll (no rate limit hammering)
- [x] safeParseJSON in both decision-engine.ts and intelligence.ts

### Documentation
- [x] README.md updated
- [x] DEMO_SCRIPT.md created
- [x] docs/ folder with all test plans
- [x] supabase/SETUP_README.md present
- [x] .env.local.example complete

### Repository
- [ ] `.gitignore` includes `.env.local`
- [ ] `.gitignore` includes `node_modules/`
- [ ] `.gitignore` includes `.next/`
- [ ] `.gitignore` includes `tmp/`
- [ ] No secrets committed in any file
- [ ] GitHub repository created
- [ ] All files pushed to `main` branch
- [ ] Repository set to Public (or confirm judge access)

---

## DEPLOYMENT VERIFICATION

### Supabase
- [ ] New project created for demo
- [ ] pgvector extension enabled
- [ ] schema.sql run successfully
- [ ] schema_v2.sql run successfully
- [ ] schema_v3.sql run successfully
- [ ] `match_document_chunks` function exists (test with SQL Editor)
- [ ] All 8 tables exist: documents, document_chunks, entities, entity_relationships, chat_sessions, chat_messages, assets, risks, maintenance_activities, incidents, compliance_items, ai_insights
- [ ] RLS policies allow all (for demo)

### Environment
- [ ] `.env.local` created on demo machine
- [ ] All 5 API keys entered and verified
- [ ] `npm install` runs clean
- [ ] `npm run dev` starts without warnings
- [ ] `npm run build` succeeds (optional but recommended)

---

## DEMO DATA PREPARATION

- [ ] 5-8 industrial PDFs downloaded and ready (see list below)
- [ ] All documents uploaded and status = "Ready"
- [ ] Assets page shows at least 3-5 assets
- [ ] Risks page shows at least 3-5 risks
- [ ] Knowledge Graph shows nodes
- [ ] AI Copilot tested with at least 2 queries
- [ ] Investigation run on at least 1 asset
- [ ] Decision Center generated at least once
- [ ] Morning Brief generated at least once

### Recommended Demo Documents
1. **OISD 116** — Fire Protection Systems (free from oisd.nic.in)
2. **Centrifugal Pump Maintenance Manual** — Any OEM manual (search: "centrifugal pump maintenance manual filetype:pdf")
3. **Boiler Safety SOP** — Search: "industrial boiler safety sop pdf"
4. **PESO Safety Guidelines** — Free from peso.gov.in
5. **Factory Inspection Checklist** — Search: "factory safety inspection checklist pdf"

---

## PRE-DEMO CHECKS (Day of Demo)

### 30 Minutes Before
- [ ] Laptop charged / charger available
- [ ] Internet connection tested (4G backup ready)
- [ ] Browser opened to `/dashboard` (loaded, not blank)
- [ ] All demo documents already uploaded and "Ready"
- [ ] Full demo run-through completed
- [ ] Backup screenshots taken of every key screen

### 5 Minutes Before
- [ ] Close all unnecessary browser tabs
- [ ] Disable browser notifications
- [ ] Set browser zoom to 90% (more content visible)
- [ ] Dashboard refreshed and showing live data
- [ ] Notes/script visible on second monitor or phone

---

## SUBMISSION PACKAGE CHECKLIST

- [ ] Source code ZIP or GitHub URL
- [ ] README.md
- [ ] Demo video (3-4 minutes)
- [ ] Submission document (SUBMISSION_DOCUMENT.md)
- [ ] GitHub URL with all code
- [ ] Any additional files requested by organizer
