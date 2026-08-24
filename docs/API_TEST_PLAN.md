# IndusMind AI — API Test Plan
**Version:** RC2-Approved

---

## Test Conventions
- Base URL: `http://localhost:3000`
- All POST requests use `Content-Type: application/json`
- Expected status codes listed per case
- "Graceful" = no stack trace in response, no crash

---

## POST /api/upload

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid PDF | 1MB PDF, category="safety" | `{documentId, status:"processing"}` | 200 |
| Valid DOCX | .docx file | `{documentId, status:"processing"}` | 200 |
| Valid TXT | .txt file | `{documentId, status:"processing"}` | 200 |
| No file | Empty FormData | `{error:"No file provided"}` | 400 |
| Oversized | 25MB PDF | `{error:"File exceeds 20MB limit"}` | 413 |
| Wrong type | .exe file | `{error:"Unsupported file type..."}` | 400 |
| Empty file | 0 byte PDF | `{error:...}` after processing | 200 then error status |

---

## GET /api/documents/:id/status

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid doc processing | Real documentId | `{id, status, total_chunks}` | 200 |
| Unknown ID | Random UUID | `{error:"Not found"}` | 404 |
| Missing ID | No params | Error response | 400 |
| Malformed UUID | `"not-a-uuid"` | 404 or 400 | — |

---

## POST /api/chat

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid query, no docs | `{query:"What is a boiler?"}` | Answer with empty sources | 200 |
| Valid query, with docs | Query matching doc content | Answer with sources array | 200 |
| Empty query | `{query:""}` | `{error:"Query is required"}` | 400 |
| Query only spaces | `{query:"   "}` | `{error:"Query is required"}` | 400 |
| Very long query | 3000 char string | Truncated to 2000, processes normally | 200 |
| With sessionId | Existing sessionId | Same session, history used | 200 |
| Invalid sessionId | `{sessionId:"fake"}` | Creates new session gracefully | 200 |
| Groq down (simulated) | Valid query | `{error:"Failed to generate..."}` | 500 |

---

## GET /api/health

| Test Case | Expected | Status |
|-----------|----------|--------|
| Empty database | Score=100, Grade="A", components present | 200 |
| DB with risks | Score < 100, components reflect data | 200 |
| DB unavailable | Degraded response with score=0, no crash | 200 |

---

## GET /api/decisions

| Test Case | Expected | Status |
|-----------|----------|--------|
| Empty database | Single "upload documents" placeholder decision | 200 |
| DB with assets/risks | 4-6 decisions with evidence | 200 |
| Groq timeout | `{decisions:[]}` gracefully | 200 |

---

## POST /api/investigate

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid assetId | Real asset UUID | Full investigation report | 200 |
| Unknown assetId | Random UUID | Report with "Asset not found" message | 200 |
| Missing assetId | `{}` | `{error:"Valid assetId required"}` | 400 |
| String "null" | `{assetId:"null"}` | Error response | 400 |

---

## POST /api/brief

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Morning brief | `{type:"morning"}` | Brief with 4-6 sections | 200 |
| Weekly report | `{type:"weekly"}` | Brief with sections | 200 |
| Executive summary | `{type:"executive"}` | Brief with sections | 200 |
| Critical risk | `{type:"critical_risk"}` | Brief with sections | 200 |
| Invalid type | `{type:"quarterly"}` | `{error:"Invalid brief type"}` | 400 |
| Missing type | `{}` | 400 error | 400 |

---

## POST /api/scenario

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid scenario | `{scenario:"What if boiler shuts down?"}` | Full analysis | 200 |
| Empty scenario | `{scenario:""}` | `{error:"Scenario text is required"}` | 400 |
| "null" string | `{scenario:"null"}` | `{error:"Scenario text is required"}` | 400 |
| XSS attempt | `{scenario:"<script>alert(1)</script>"}` | Sanitized, analyzed | 200 |
| 1000 char input | Long scenario text | Truncated to 500, analyzed | 200 |

---

## POST /api/failure-prediction

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid assetId | Real asset UUID | `{probability, risk_level, reasons, recommendations}` | 200 |
| Unknown assetId | Random UUID | Fallback response with low probability | 200 |
| Missing assetId | `{}` | `{error:"Valid assetId required"}` | 400 |
| Probability always 0-1 | Any asset | `probability` clamped between 0 and 1 | 200 |

---

## POST /api/root-cause

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid request | `{assetId, query:"Why failing?"}` | RCA with root causes | 200 |
| Missing query | `{assetId:"x", query:""}` | 400 error | 400 |
| "null" query | `{assetId:"x", query:"null"}` | 400 error | 400 |
| No history | Asset with no incidents | Fallback message | 200 |

---

## GET /api/assets

| Test Case | Expected | Status |
|-----------|----------|--------|
| List all | Array of assets | 200 |
| `?id=validUUID` | Asset with risks/maintenance/incidents joined | 200 |
| `?id=unknownUUID` | Error | 404/500 |
| Empty DB | `[]` | 200 |

---

## GET /api/entities

| Test Case | Expected | Status |
|-----------|----------|--------|
| Entities exist | `{nodes:[...], edges:[...]}` | 200 |
| Empty DB | `{nodes:[], edges:[]}` | 200 |
| DB error | `{nodes:[], edges:[]}` gracefully | 200 |

---

## Error Response Standards

Every API error response must:
1. Return valid JSON (not empty body)
2. Contain an `error` string field
3. Never expose stack traces
4. Return appropriate HTTP status code
5. Not crash the server

---

## Rate Limit Behavior

Groq free tier: ~30 requests/minute for LLaMA 3.3 70B
- Single upload: 2-4 Groq calls (sequential extraction)
- Investigation: 1 Groq call
- Decision generation: 1 Groq call
- Brief generation: 2 Groq calls (health + brief)
- **Safe throughput:** 1 upload + 2-3 AI features per minute
