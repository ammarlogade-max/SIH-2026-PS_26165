// ─── Automated Test Suite: Multi-Format Safety Report Ingestion ─────────────

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseUploadedDocument, commitCanonicalEventsToPipeline } from "../src/lib/ingestion/ingestion-pipeline";
import { detectDocumentFormat } from "../src/lib/ingestion/detector";
import { inferColumnMapping } from "../src/lib/ingestion/column-mapper";
import { computeDocumentFingerprint } from "../src/lib/ingestion/fingerprint";
import { getSafetySnapshot } from "../src/lib/safety-store";

const FIXTURES_DIR = path.join(process.cwd(), "tests", "fixtures");

test("SIF Sentinel — Multi-Format Document Ingestion Test Suite", async (t) => {
  // 1. PDF text extraction
  await t.test("1. PDF text extraction extracts narrative, page numbers, and preserves metadata", async () => {
    const pdfPath = path.join(FIXTURES_DIR, "safety_incident_001.pdf");
    const buffer = fs.readFileSync(pdfPath);

    const result = await parseUploadedDocument(buffer, "safety_incident_001.pdf");
    assert.equal(result.status, "success");
    assert.equal(result.format, "pdf");
    assert.equal(result.is_scanned, false);
    assert.equal(result.canonical_events.length, 1);

    const event = result.canonical_events[0];
    assert.ok(event.raw_text.includes("High pressure mud hose vibrated violently"));
    assert.equal(event.site, "Naharkatiya Well Pad 14");
    assert.equal(event.activity, "Mud Circulation");
    assert.equal(event.reported_date, "2026-08-14");
    assert.equal(event.event_type, "Near-Miss");
    assert.equal(event.extraction_method, "direct_text");

    // Check provenance
    assert.ok(event.provenance.length >= 1);
    const rawProv = event.provenance.find((p) => p.field === "raw_text");
    assert.ok(rawProv);
    assert.ok(rawProv.source.includes("page"));
  });

  // 2. Scanned PDF / OCR fallback path
  await t.test("2. Scanned PDF triggers OCR fallback and preserves OCR confidence", async () => {
    const scannedPdfPath = path.join(FIXTURES_DIR, "scanned_incident_007.pdf");
    const buffer = fs.readFileSync(scannedPdfPath);

    const result = await parseUploadedDocument(buffer, "scanned_incident_007.pdf");
    assert.equal(result.format, "pdf");
    assert.equal(result.is_scanned, true);
    assert.equal(result.ocr_applied, true);
    assert.ok((result.ocr_confidence || 0) > 0);
    assert.equal(result.canonical_events.length, 1);

    const event = result.canonical_events[0];
    assert.equal(event.extraction_method, "ocr");
    assert.ok(event.raw_text.toLowerCase().includes("oxygen") || event.raw_text.toLowerCase().includes("safety"));
  });

  // 3. DOCX extraction
  await t.test("3. DOCX extraction reads paragraphs and extracts structured observation", async () => {
    const docxPath = path.join(FIXTURES_DIR, "safety_report_002.docx");
    const buffer = fs.readFileSync(docxPath);

    const result = await parseUploadedDocument(buffer, "safety_report_002.docx");
    assert.equal(result.status, "success");
    assert.equal(result.format, "docx");
    assert.equal(result.canonical_events.length, 1);

    const event = result.canonical_events[0];
    assert.ok(event.raw_text.includes("Confined space entry permit was signed"));
    assert.equal(event.site, "Moran GGS Complex");
    assert.equal(event.activity, "Confined Space Vessel Inspection");
    assert.equal(event.reported_date, "2026-08-16");
    assert.equal(event.extraction_method, "docx_xml");
  });

  // 4. XLSX extraction with multi-row mapping and worksheet provenance
  await t.test("4. XLSX extraction parses multiple rows and retains worksheet + row + col provenance", async () => {
    const xlsxPath = path.join(FIXTURES_DIR, "safety_observations_003.xlsx");
    const buffer = fs.readFileSync(xlsxPath);

    const result = await parseUploadedDocument(buffer, "safety_observations_003.xlsx");
    assert.equal(result.status, "success");
    assert.equal(result.format, "xlsx");
    assert.equal(result.canonical_events.length, 3);
    assert.ok(result.available_sheets?.includes("Safety Observations"));

    const firstEvent = result.canonical_events[0];
    assert.ok(firstEvent.raw_text.includes("Overhead crane wire rope"));
    assert.equal(firstEvent.site, "Duliajan Central Workshop");
    assert.equal(firstEvent.activity, "Heavy Mechanical Lifting");
    assert.equal(firstEvent.reported_date, "2026-08-18");
    assert.equal(firstEvent.event_type, "Unsafe Condition");

    // Check strict spreadsheet provenance
    const textProv = firstEvent.provenance.find((p) => p.field === "raw_text");
    assert.ok(textProv);
    assert.ok(textProv.source.includes("worksheet 'Safety Observations'"));
    assert.ok(textProv.source.includes("row 2"));
  });

  // 5. CSV extraction
  await t.test("5. CSV extraction accurately identifies columns and parses observations", async () => {
    const csvPath = path.join(FIXTURES_DIR, "safety_nearmiss_004.csv");
    const buffer = fs.readFileSync(csvPath);

    const result = await parseUploadedDocument(buffer, "safety_nearmiss_004.csv");
    assert.equal(result.status, "success");
    assert.equal(result.format, "csv");
    assert.equal(result.canonical_events.length, 2);

    const firstEvent = result.canonical_events[0];
    assert.ok(firstEvent.raw_text.includes("Scaffolding cross-brace missing"));
    assert.equal(firstEvent.site, "Jorhat GGS");
    assert.equal(firstEvent.activity, "Work at Height");
    assert.equal(firstEvent.reported_date, "2026-08-21");
  });

  // 6. Plain TXT extraction
  await t.test("6. Plain TXT parser extracts safety observation card", async () => {
    const txtPath = path.join(FIXTURES_DIR, "safety_card_005.txt");
    const buffer = fs.readFileSync(txtPath);

    const result = await parseUploadedDocument(buffer, "safety_card_005.txt");
    assert.equal(result.status, "success");
    assert.equal(result.format, "txt");
    assert.equal(result.canonical_events.length, 1);

    const event = result.canonical_events[0];
    assert.ok(event.raw_text.includes("Derrickman observed that high pressure cementing line"));
    assert.equal(event.site, "Shalmari Rig 2");
    assert.equal(event.activity, "Casing Running Operations");
  });

  // 7. Scanned Image OCR extraction
  await t.test("7. Scanned Image OCR extracts text and logs OCR confidence", async () => {
    const imgPath = path.join(FIXTURES_DIR, "scanned_observation_006.png");
    const buffer = fs.readFileSync(imgPath);

    const result = await parseUploadedDocument(buffer, "scanned_observation_006.png");
    assert.equal(result.format, "image");
    assert.equal(result.is_scanned, true);
    assert.equal(result.ocr_applied, true);
    assert.ok((result.ocr_confidence || 0) > 70);
    assert.equal(result.canonical_events.length, 1);

    const event = result.canonical_events[0];
    assert.equal(event.extraction_method, "ocr");
    assert.ok(event.raw_text.toLowerCase().includes("oxygen") || event.raw_text.toLowerCase().includes("safety"));
  });

  // 8. Missing metadata preservation (Strict: never guess or invent)
  await t.test("8. Strict metadata rule: missing site/activity/date are kept null/UNKNOWN", async () => {
    const sparseText = "Worker slipped on wet mud while walking near drill pipe rack.";
    const buffer = Buffer.from(sparseText, "utf-8");

    const result = await parseUploadedDocument(buffer, "unlabeled_observation.txt");
    assert.equal(result.status, "success");
    assert.equal(result.canonical_events.length, 1);

    const event = result.canonical_events[0];
    assert.equal(event.site, null);
    assert.equal(event.activity, null);
    assert.equal(event.reported_date, null);
    assert.equal(event.raw_text, sparseText);
  });

  // 9. Malformed file handling
  await t.test("9. Corrupted file returns structured error without crashing server", async () => {
    const corruptedBuffer = Buffer.from("%PDF-1.4\ncorrupted-random-binary-noise\x00\xFF\xAA%%EOF", "utf-8");
    const result = await parseUploadedDocument(corruptedBuffer, "corrupted_document.pdf");
    assert.equal(result.status, "error");
    assert.ok(result.errors.length > 0);
    assert.equal(result.canonical_events.length, 0);
  });

  // 10. Duplicate detection
  await t.test("10. SHA-256 fingerprint detects duplicate uploads", async () => {
    const pdfPath = path.join(FIXTURES_DIR, "safety_incident_001.pdf");
    const buffer = fs.readFileSync(pdfPath);

    const fp = computeDocumentFingerprint(buffer);
    const existingFp = new Set<string>([fp]);

    const result = await parseUploadedDocument(buffer, "duplicate_copy.pdf", {
      existingFingerprints: existingFp,
    });

    assert.equal(result.is_duplicate, true);
    assert.ok(result.warnings.some((w) => w.toLowerCase().includes("duplicate")));
  });

  // 11. Unsupported extension handling
  await t.test("11. Unsupported extension displays helpful instructions without crashing", async () => {
    const buffer = Buffer.from("random executable content");
    const result = await parseUploadedDocument(buffer, "malicious_script.exe");
    assert.equal(result.status, "unsupported");
    assert.equal(result.format, "unsupported");
    assert.ok(result.errors[0].toLowerCase().includes("unsupported"));
  });

  // 12. Canonical event reaching the existing SIF analysis pipeline
  await t.test("12. Canonical safety events successfully pass into existing SIF Sentinel pipeline", async () => {
    const docxPath = path.join(FIXTURES_DIR, "safety_report_002.docx");
    const buffer = fs.readFileSync(docxPath);
    const parseRes = await parseUploadedDocument(buffer, "safety_report_002.docx");

    const initialSnapshot = await getSafetySnapshot();
    const initialReportCount = initialSnapshot.reports.length;

    const commitResult = await commitCanonicalEventsToPipeline(parseRes.canonical_events);
    assert.equal(commitResult.success, true);
    assert.equal(commitResult.total_events, 1);
    assert.ok(commitResult.sif_count >= 1); // Confined space toxic fumes should be SIF potential

    // Verify stored in safety store
    const updatedSnapshot = await getSafetySnapshot();
    assert.equal(updatedSnapshot.reports.length, initialReportCount + 1);

    const savedRep = updatedSnapshot.reports.find((r) => r.id === parseRes.canonical_events[0].event_id);
    assert.ok(savedRep);
    assert.equal((savedRep as any).source_format, "docx");
    assert.equal((savedRep as any).extraction_method, "docx_xml");

    // Verify classification is attached and active
    const savedCls = updatedSnapshot.classifications.find((c) => c.report_id === savedRep.id);
    assert.ok(savedCls);
    assert.equal(savedCls.is_sif_potential, true);
    assert.equal(savedCls.life_saving_rule, "Confined Space");
  });
});
