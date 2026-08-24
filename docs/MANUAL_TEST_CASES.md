# IndusMind AI — Manual Test Cases
**Version:** RC2-Approved

---

## TC-001: Complete Upload and Query Flow (Happy Path)
**Priority:** Critical  
**Pre-condition:** App running, all env vars set, Supabase schema applied

**Steps:**
1. Open `http://localhost:3000/upload`
2. Drag and drop a PDF (e.g., OISD boiler safety manual, max 10 pages)
3. Select category: "Safety & HSE"
4. Click "Upload"
5. Wait for status to show "Ready" (30-90 seconds)
6. Click "Ask AI Copilot →"
7. In copilot, type: "What are the safety procedures mentioned in this document?"
8. Press Enter

**Expected:**
- File processes to "Ready" without errors
- AI response contains relevant information from the PDF
- At least 1 source citation shown
- No crash at any step

---

## TC-002: Command Center Full Flow
**Priority:** Critical  
**Pre-condition:** At least 1 document processed

**Steps:**
1. Navigate to `/dashboard`
2. Observe Plant Health Index ring
3. Click "Generate" in Decision Center
4. Wait for decisions to appear (5-10 seconds)
5. Click on first decision card to expand
6. Type "What happens if main boiler shuts down?" in Scenario Analysis
7. Press Enter or click "Analyze"
8. Wait for result (5-10 seconds)

**Expected:**
- Health ring shows numeric score and letter grade
- 4-6 decision cards appear with priorities
- Expanded card shows evidence and recommended actions
- Scenario result shows operational impact and mitigations

---

## TC-003: Investigation Mode
**Priority:** Critical  
**Pre-condition:** At least 1 asset extracted from documents

**Steps:**
1. Navigate to `/dashboard/investigate`
2. Select an asset from the left panel
3. Observe "investigating" animation
4. Wait for report (8-15 seconds)

**Expected:**
- Report renders with: Executive Summary, Root Causes, Risks, Recommendations
- Confidence bar visible on root causes
- Timeline summary present
- No stale data if switching to another asset during investigation

---

## TC-004: Operational Brief Download
**Priority:** High  
**Pre-condition:** App running

**Steps:**
1. Navigate to `/dashboard/brief`
2. Select "Morning Brief" card
3. Click "Generate Morning Operational Brief"
4. Wait (5-10 seconds)
5. Click "Download" button

**Expected:**
- Brief renders with title, date, sections, key actions
- Download creates a .txt file named `morning-brief-YYYY-MM-DD.txt`
- File contains readable text with all brief content

---

## TC-005: Error Recovery — Network Interruption
**Priority:** High  
**Pre-condition:** App running

**Steps:**
1. Navigate to `/dashboard`
2. Open browser DevTools → Network tab
3. Set throttling to "Offline"
4. Click "Generate" in Decision Center
5. Wait for result
6. Restore network connection
7. Click "Generate" again

**Expected:**
- First attempt: error message shown, button re-enabled (not frozen)
- Second attempt: works normally after network restored
- No white screen at any point
- No permanently disabled buttons

---

## TC-006: Upload Error Handling
**Priority:** High

**Steps:**
1. Navigate to `/upload`
2. Try to upload a `.exe` file renamed to `.pdf` (drag & drop)
3. Try to upload a file larger than 20MB
4. Try to upload an empty text file (0 bytes named `empty.txt`)

**Expected:**
- .exe file: "Unsupported file type" error (may be caught client-side by dropzone)
- 20MB+ file: "File too large" or rejected by dropzone  
- Empty file: Accepts upload, shows "processing", then "error" state with message

---

## TC-007: Knowledge Graph Render
**Priority:** Medium  
**Pre-condition:** Documents uploaded and processed

**Steps:**
1. Navigate to `/dashboard/graph`
2. Wait for graph to load
3. Click on any node
4. Use type filter buttons
5. Click refresh

**Expected:**
- Nodes appear in SVG (not blank)
- Clicking node opens right detail panel
- Filter reduces visible nodes
- Refresh re-fetches data
- No console errors about NaN coordinates

---

## TC-008: Rapid Asset Switching (Race Condition Test)
**Priority:** Medium  
**Pre-condition:** Multiple assets extracted

**Steps:**
1. Navigate to `/dashboard/assets`
2. Click Asset A
3. Immediately click "Run AI Prediction"
4. Before prediction completes, click Asset B
5. Wait for prediction to finish

**Expected:**
- Prediction result does NOT appear on Asset B
- Only the prediction for Asset A was silently discarded
- Asset B panel shows no prediction result
- Predicting button is re-enabled

---

## TC-009: Empty Database State
**Priority:** Medium  
**Pre-condition:** Fresh Supabase with schemas applied, no documents uploaded

**Steps:**
1. Open each of these pages in order:
   - `/dashboard`
   - `/dashboard/assets`
   - `/dashboard/risks`
   - `/dashboard/maintenance`
   - `/dashboard/incidents`
   - `/dashboard/compliance`
   - `/dashboard/insights`
   - `/dashboard/graph`
   - `/dashboard/chat`
   - `/dashboard/twin`
   - `/dashboard/investigate`

**Expected:**
- No white screens on any page
- Every page shows a meaningful empty state (icon + message + action)
- Dashboard shows Health score = 100 (nothing bad detected)
- Chat shows suggested queries even with no documents

---

## TC-010: Brief All Four Types
**Priority:** Medium

**Steps:**
1. Navigate to `/dashboard/brief`
2. Generate all 4 brief types sequentially
3. Download each one

**Expected:**
- All 4 types generate without error
- Each has different focus/content
- All downloads produce valid .txt files
- No permanently loading states
