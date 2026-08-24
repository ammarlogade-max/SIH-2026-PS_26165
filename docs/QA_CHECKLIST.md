# IndusMind AI — QA Checklist
**Version:** RC2-Approved  
**Date:** Pre-submission  
**Tester:** _______________

Mark each item: ✅ Pass | ❌ Fail | ⚠️ Partial | N/A

---

## 1. Environment Setup

- [ ] `.env.local` created from `.env.local.example`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set and valid
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set and valid
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set and valid
- [ ] `GROQ_API_KEY` set and valid (test at console.groq.com)
- [ ] `OPENAI_API_KEY` set and valid (test at platform.openai.com)
- [ ] All three SQL schemas run in Supabase: schema.sql → schema_v2.sql → schema_v3.sql
- [ ] pgvector extension enabled in Supabase
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts without warnings in terminal

---

## 2. Upload Flow

- [ ] Drag and drop PDF works
- [ ] Click to browse and select PDF works
- [ ] DOCX file accepted
- [ ] TXT file accepted
- [ ] File > 20MB rejected with error message
- [ ] .exe file rejected with error message
- [ ] Category selector works (6 options)
- [ ] Description field accepts text (max 200 chars)
- [ ] Upload button becomes active after file added
- [ ] Upload All button uploads files sequentially (not simultaneously)
- [ ] Progress bar advances during upload
- [ ] Status changes: uploading → processing → ready
- [ ] "Ready" state shows green checkmark
- [ ] Error state shows red message if processing fails
- [ ] CTA buttons appear after successful upload
- [ ] Uploaded document appears in Documents page

---

## 3. Document Processing

- [ ] PDF text extraction works (non-scanned PDF)
- [ ] DOCX text extraction works
- [ ] TXT extraction works
- [ ] Assets auto-extracted and visible in Assets page
- [ ] Risks auto-extracted and visible in Risks page
- [ ] Maintenance activities auto-extracted
- [ ] Incidents auto-extracted (category: maintenance/operations)
- [ ] Compliance items auto-extracted (category: compliance)
- [ ] Entities visible in Knowledge Graph
- [ ] `total_chunks` > 0 in Documents page
- [ ] Document status = "ready" in Documents page

---

## 4. Command Center Dashboard

- [ ] Page loads without white screen
- [ ] Plant Health Index ring renders with score and grade
- [ ] 6 KPI tiles show correct numbers
- [ ] Trend icon (↑ ↓ →) renders correctly
- [ ] Health components 5 bars render with correct colors
- [ ] "Generate" button in Decision Center is clickable
- [ ] Decision cards appear after generation
- [ ] Expanding a decision shows evidence + actions
- [ ] Scenario input field accepts text
- [ ] Quick scenario buttons pre-fill the input
- [ ] Scenario analysis renders result
- [ ] 8 quick-nav tiles at bottom are clickable
- [ ] Refresh button re-fetches all data

---

## 5. AI Copilot

- [ ] Page loads with suggested queries
- [ ] Clicking a suggestion sends the query
- [ ] Typing in input and pressing Enter sends query
- [ ] Loading dots appear while AI thinks
- [ ] Response renders with markdown formatting
- [ ] Source citations appear below response
- [ ] Expanding sources shows chunk content + similarity %
- [ ] New Chat button resets conversation
- [ ] Shift+Enter creates newline (doesn't send)
- [ ] Input max 2000 characters enforced
- [ ] Error message shown if API fails (not blank)

---

## 6. Asset Intelligence

- [ ] Asset list loads in left panel
- [ ] Filter buttons work (all, critical, high, operational, maintenance)
- [ ] Clicking an asset loads its detail panel
- [ ] Status, Risk Level, Failure Prob, Incidents KPIs show
- [ ] "Run AI Prediction" button is clickable
- [ ] Failure prediction result renders with probability bar
- [ ] Risk factors and recommendations listed
- [ ] Associated Risks section shows (if data exists)
- [ ] Maintenance History section shows (if data exists)
- [ ] Incident History section shows (if data exists)
- [ ] Switching assets clears old prediction (no stale data)

---

## 7. Risk Intelligence

- [ ] Risk list loads
- [ ] 4 severity count cards show correct numbers
- [ ] Search filter works
- [ ] Severity filter buttons work
- [ ] Selecting a risk shows detail panel
- [ ] Evidence list shown in detail panel
- [ ] Root Cause Analysis input visible (if asset_id exists)
- [ ] RCA query input accepts text
- [ ] "Analyze" button triggers RCA
- [ ] RCA result renders with root causes + confidence bars
- [ ] "Mark as mitigated" check button works
- [ ] Mitigated risk updates in list without page reload

---

## 8. Maintenance Intelligence

- [ ] Maintenance items load
- [ ] 4 status count cards clickable as filters
- [ ] Type/priority filters work
- [ ] "Start" button changes status to in_progress
- [ ] "Complete" button changes status to completed
- [ ] Completed items show green "Done" indicator
- [ ] Overdue items highlighted in red
- [ ] Asset name shown in Asset column

---

## 9. Incidents

- [ ] Incidents list loads
- [ ] Severity count cards show
- [ ] Filters work
- [ ] Selecting incident shows detail panel
- [ ] Root causes listed
- [ ] Corrective actions listed

---

## 10. Compliance

- [ ] Compliance items load
- [ ] Score gauge shows percentage
- [ ] Circular progress ring renders correctly
- [ ] By-Regulation breakdown shows per-regulation progress bars
- [ ] Status filters work
- [ ] Gap description column shows text

---

## 11. AI Insights Feed

- [ ] Insights load on page open
- [ ] Unread count badge shows
- [ ] "Generate Insights" button triggers new insights
- [ ] Severity badges (critical/warning/info) show correct colors
- [ ] Type icons (🔧⚠️📋🚨💡) show
- [ ] Mark individual insight as read works (dot goes grey)
- [ ] "Mark all read" button works
- [ ] Filters (all/critical/warning/info/type) work

---

## 12. Knowledge Graph

- [ ] Graph renders SVG (not blank)
- [ ] Nodes show entity type abbreviation
- [ ] Node names truncated at 18 chars
- [ ] Clicking a node opens detail panel
- [ ] Detail panel shows entity type, name, description, source
- [ ] Filter buttons filter by entity type
- [ ] Refresh button re-fetches graph
- [ ] Error state shown if API fails
- [ ] Empty state shown if no entities extracted

---

## 13. Digital Twin

- [ ] Asset hierarchy tree loads
- [ ] Groups are expandable/collapsible
- [ ] Risk level dot colors correct
- [ ] Clicking asset loads detail panel
- [ ] Detail panel shows KPIs
- [ ] "AI Predict Failure" button works
- [ ] Prediction result renders
- [ ] Maintenance / Incidents / SOPs panels show

---

## 14. Investigation Mode

- [ ] Asset list loads in sidebar
- [ ] Search filters assets
- [ ] Clicking asset starts investigation
- [ ] Animated "investigating" state shows
- [ ] Report renders: Executive Summary, Root Causes, Risks, Recommendations
- [ ] Confidence bar renders for root causes
- [ ] Switching asset mid-investigation doesn't show stale report

---

## 15. Operational Briefings

- [ ] 4 brief type cards selectable
- [ ] Generate button triggers AI
- [ ] Brief renders with title, date, health score
- [ ] Sections render with correct severity colors
- [ ] Key actions list with priority badges
- [ ] Closing statement renders
- [ ] Download button creates .txt file

---

## 16. Error & Edge States

- [ ] Upload with no env keys → graceful error (not white screen)
- [ ] Empty database → all pages show helpful empty states (not blank)
- [ ] Network disconnect during Groq call → error message, button re-enabled
- [ ] Refresh on any page → page reloads correctly
- [ ] Browser back button → works correctly
- [ ] All loading spinners eventually resolve (no infinite spinners)
