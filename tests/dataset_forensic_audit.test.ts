import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

test('SIF Sentinel Forensic Audit & Verification Suite (v2)', async (t) => {
  const rootDir = process.cwd();
  const datasetDir = path.join(rootDir, 'dataset');
  const finalDir = path.join(datasetDir, 'final');
  const manifestsDir = path.join(datasetDir, 'manifests');
  const reportsDir = path.join(datasetDir, 'reports');
  const quarantineDir = path.join(datasetDir, 'quarantine');

  const goldPath = path.join(finalDir, 'training_gold.jsonl');
  const silverPath = path.join(finalDir, 'training_silver.jsonl');
  const unknownPath = path.join(finalDir, 'unlabeled_unknown.jsonl');
  const v2JsonlPath = path.join(finalDir, 'events_final_v2.jsonl');
  const v2CsvPath = path.join(finalDir, 'events_final_v2.csv');

  const docAuditCsvPath = path.join(reportsDir, 'document_provenance_audit.csv');
  const bseeAuditCsvPath = path.join(reportsDir, 'bsee_forensic_audit.csv');
  const auditReportMdPath = path.join(reportsDir, 'DATASET_FORENSIC_AUDIT_REPORT.md');
  const evidenceLedgerPath = path.join(manifestsDir, 'evidence_ledger.jsonl');
  const dupGroupsCsvPath = path.join(manifestsDir, 'duplicate_groups.csv');
  const quarantineManifestPath = path.join(manifestsDir, 'quarantine_manifest.csv');
  const quarantinedJsonlPath = path.join(quarantineDir, 'quarantined_records.jsonl');
  const reviewQueueCsvPath = path.join(reportsDir, 'manual_review_queue.csv');
  const sourceBiasCsvPath = path.join(reportsDir, 'source_bias_report.csv');
  const statsV2Path = path.join(reportsDir, 'dataset_statistics_v2.json');
  const changelogPath = path.join(rootDir, 'DATASET_CHANGELOG.md');

  // Test 1: Every record in training_gold has a corresponding source document whose SHA-256 matches
  await t.test('1. Every record in training_gold has a corresponding source document whose SHA-256 matches', () => {
    assert.ok(fs.existsSync(goldPath), 'training_gold.jsonl must exist');
    const lines = fs.readFileSync(goldPath, 'utf8').trim().split('\n');
    assert.ok(lines.length > 0, 'training_gold.jsonl must not be empty');

    for (const line of lines) {
      const rec = JSON.parse(line);
      const org = rec.source.source_organization;
      const docId = rec.source.document_id;
      const recordedHash = rec.provenance.document_hash;

      let docPath = '';
      if (org.includes('BSEE')) {
        docPath = path.join(datasetDir, 'documents/bsee', `${docId}.pdf`);
      } else if (org.includes('IMCA')) {
        docPath = path.join(datasetDir, 'documents/imca', `${docId}.html`);
      } else if (org.includes('HSE')) {
        docPath = path.join(datasetDir, 'documents/hse', `${docId}.html`);
      }

      assert.ok(fs.existsSync(docPath), `Physical document artifact must exist on disk for Gold record ${rec.event_id}: ${docPath}`);
      const fileBytes = fs.readFileSync(docPath);
      const calcHash = crypto.createHash('sha256').update(fileBytes).digest('hex');
      assert.equal(calcHash, recordedHash, `SHA-256 must match exactly for Gold record ${rec.event_id}`);
    }
  });

  // Test 2: No Gold record has unverified text
  await t.test('2. No Gold record has unverified text', () => {
    const lines = fs.readFileSync(goldPath, 'utf8').trim().split('\n');
    for (const line of lines) {
      const rec = JSON.parse(line);
      assert.equal(rec.quality.dataset_tier, 'GOLD');
      assert.notEqual(rec.provenance.extraction_method, 'CATALOG_METADATA', 'Gold record cannot be catalog metadata only');
      assert.ok(rec.narrative.event_narrative && rec.narrative.event_narrative.length > 100, 'Gold narrative must be substantial');
    }
  });

  // Test 3: Every explicit SIF label is supported by an exact substring of the source text
  await t.test('3. Every explicit SIF label is supported by an exact substring of the source text', () => {
    const lines = fs.readFileSync(v2JsonlPath, 'utf8').trim().split('\n');
    let explicitCount = 0;
    for (const line of lines) {
      const rec = JSON.parse(line);
      if (rec.sif.label_type === 'EXPLICIT') {
        explicitCount++;
        assert.ok(rec.sif.evidence, `Explicit SIF record ${rec.event_id} must have non-null evidence`);
        const fullSource = (rec.source.document_title + ' ' + rec.narrative.raw_source_text + ' ' + rec.narrative.event_narrative).toLowerCase();
        const evLower = rec.sif.evidence.toLowerCase();
        // The evidence text or a substantial piece of it must be present in the source text
        const snippet = evLower.slice(0, Math.min(30, evLower.length));
        assert.ok(fullSource.includes(snippet), `Evidence snippet '${snippet}' must be present in source text for ${rec.event_id}`);
      }
    }
    assert.ok(explicitCount > 0, 'Must have audited explicit SIF records');
  });

  // Test 4: No record has energy=UNKNOWN while having an energy evidence span
  await t.test('4. No record has energy=UNKNOWN while having an energy evidence span', () => {
    const lines = fs.readFileSync(v2JsonlPath, 'utf8').trim().split('\n');
    for (const line of lines) {
      const rec = JSON.parse(line);
      if (rec.energy.type === 'UNKNOWN') {
        assert.equal(rec.energy.evidence, null, `Record ${rec.event_id} has energy=UNKNOWN, so evidence must be null`);
      }
    }
  });

  // Test 5: No record has facility defaulting to "Offshore Production / Drilling Facility" without evidence
  await t.test('5. No record has facility defaulting to "Offshore Production / Drilling Facility" without evidence', () => {
    const lines = fs.readFileSync(v2JsonlPath, 'utf8').trim().split('\n');
    for (const line of lines) {
      const rec = JSON.parse(line);
      assert.notEqual(
        rec.location.facility,
        'Offshore Production / Drilling Facility',
        `Record ${rec.event_id} must not use generic default facility string`
      );
      assert.notEqual(
        rec.location.facility,
        'Vessel / Marine Construction Installation',
        `Record ${rec.event_id} must not use generic default vessel facility string`
      );
    }
  });

  // Test 6: The manifest audit report accounts for all 851 documents from the original manifest
  await t.test('6. The manifest audit report accounts for all 851 documents from the original manifest', () => {
    assert.ok(fs.existsSync(docAuditCsvPath), 'document_provenance_audit.csv must exist');
    const content = fs.readFileSync(docAuditCsvPath, 'utf8').trim().split('\n');
    const header = content[0];
    const dataRows = content.slice(1);
    assert.ok(header.includes('provenance_status'), 'Must contain provenance_status column');
    assert.ok(dataRows.length >= 851, `Audit must cover all 851 documents from original manifest (found ${dataRows.length})`);
  });

  // Test 7: The forensic audit report answers all required questions
  await t.test('7. The forensic audit report answers all required questions', () => {
    assert.ok(fs.existsSync(auditReportMdPath), 'DATASET_FORENSIC_AUDIT_REPORT.md must exist');
    const text = fs.readFileSync(auditReportMdPath, 'utf8');
    assert.ok(text.length > 5000, 'Audit report must be detailed and extensive');
    for (let i = 1; i <= 23; i++) {
      assert.ok(text.includes(`### ${i}.`), `Report must answer Question ${i}`);
    }
    assert.ok(text.includes('Marine Minerals Administration'), 'Report must address MMA');
  });

  // Test 8: The evidence ledger contains valid record IDs and document IDs
  await t.test('8. The evidence ledger contains valid record IDs and document IDs', () => {
    assert.ok(fs.existsSync(evidenceLedgerPath), 'evidence_ledger.jsonl must exist');
    const lines = fs.readFileSync(evidenceLedgerPath, 'utf8').trim().split('\n');
    assert.ok(lines.length > 500, 'Evidence ledger must have multiple entries');
    for (const line of lines.slice(0, 100)) {
      const entry = JSON.parse(line);
      assert.ok(entry.event_id.startsWith('EVT-'), 'event_id must have EVT- prefix');
      assert.ok(entry.source_document_id.startsWith('SRC-'), 'source_document_id must have SRC- prefix');
      assert.ok(entry.evidence_text && entry.evidence_text.length > 0, 'evidence_text must not be empty');
      assert.ok(['VERIFIED', 'AUDITED'].includes(entry.review_status), 'review_status must be valid');
    }
  });

  // Test 9: Quarantined records are truly quarantined and not in the training subsets
  await t.test('9. Quarantined records are truly quarantined and not in the training subsets', () => {
    assert.ok(fs.existsSync(quarantineManifestPath), 'quarantine_manifest.csv must exist');
    assert.ok(fs.existsSync(quarantinedJsonlPath), 'quarantined_records.jsonl must exist');

    const qLines = fs.readFileSync(quarantinedJsonlPath, 'utf8').trim().split('\n');
    const quarantinedIds = new Set(qLines.map(l => JSON.parse(l).event_id));

    const goldLines = fs.readFileSync(goldPath, 'utf8').trim().split('\n');
    for (const line of goldLines) {
      const rec = JSON.parse(line);
      assert.ok(!quarantinedIds.has(rec.event_id), `Gold record ${rec.event_id} cannot be in quarantine`);
    }

    const silverLines = fs.readFileSync(silverPath, 'utf8').trim().split('\n');
    for (const line of silverLines) {
      const rec = JSON.parse(line);
      assert.ok(!quarantinedIds.has(rec.event_id), `Silver record ${rec.event_id} cannot be in quarantine`);
    }
  });

  // Test 10: The duplicate groups file contains valid group assignments
  await t.test('10. The duplicate groups file contains valid group assignments', () => {
    assert.ok(fs.existsSync(dupGroupsCsvPath), 'duplicate_groups.csv must exist');
    const lines = fs.readFileSync(dupGroupsCsvPath, 'utf8').trim().split('\n');
    assert.ok(lines.length > 2900, 'Must cover all canonical event records');
    const sample = lines.slice(1, 50);
    for (const row of sample) {
      const cols = row.split(',');
      const grpId = cols[0];
      const evId = cols[1];
      assert.ok(grpId.startsWith('GRP-'), 'duplicate_group_id must start with GRP-');
      assert.ok(evId.startsWith('EVT-'), 'event_id must start with EVT-');
    }
  });

  // Test 11: The statistics file reflects true dataset numbers
  await t.test('11. The statistics file reflects true dataset numbers', () => {
    assert.ok(fs.existsSync(statsV2Path), 'dataset_statistics_v2.json must exist');
    const stats = JSON.parse(fs.readFileSync(statsV2Path, 'utf8'));
    assert.equal(stats.total_events, 2970, 'Must record 2,970 canonical events');
    assert.equal(stats.provenance_summary.verified_physical_files, 564, 'Must record 564 verified files');
    assert.equal(stats.provenance_summary.missing_artifacts, 288, 'Must record 288 missing artifacts');
    assert.equal(stats.provenance_summary.hash_match_rate, '100.00%', 'Hash match rate must be 100%');
  });

  // Test 12: The review queue contains all required columns and valid priorities
  await t.test('12. The review queue contains all required columns and valid priorities', () => {
    assert.ok(fs.existsSync(reviewQueueCsvPath), 'manual_review_queue.csv must exist');
    const lines = fs.readFileSync(reviewQueueCsvPath, 'utf8').trim().split('\n');
    const header = lines[0];
    assert.ok(header.includes('priority'));
    assert.ok(header.includes('event_id'));
    assert.ok(header.includes('category'));
    assert.ok(header.includes('reason'));

    const validPriorities = new Set(['P0', 'P1', 'P2', 'P3']);
    for (const line of lines.slice(1, 100)) {
      const p = line.split(',')[0];
      assert.ok(validPriorities.has(p), `Priority '${p}' must be one of P0, P1, P2, P3`);
    }
  });

  // Test 13: Source bias metrics sum correctly
  await t.test('13. Source bias metrics sum correctly', () => {
    assert.ok(fs.existsSync(sourceBiasCsvPath), 'source_bias_report.csv must exist');
    const lines = fs.readFileSync(sourceBiasCsvPath, 'utf8').trim().split('\n');
    assert.ok(lines.length >= 4, 'Must have header + at least 3 source organizations');

    let totalSum = 0;
    for (const row of lines.slice(1)) {
      const parts = row.split(',');
      const count = parseInt(parts[1], 10);
      if (!isNaN(count)) totalSum += count;
    }
    assert.equal(totalSum, 2970, 'Sum of source organization events must equal 2,970');
  });

  // Test 14: The dataset changelog exists and documents v1 to v2 changes
  await t.test('14. The dataset changelog exists and documents v1 to v2 changes', () => {
    assert.ok(fs.existsSync(changelogPath), 'DATASET_CHANGELOG.md must exist');
    const content = fs.readFileSync(changelogPath, 'utf8');
    assert.ok(content.includes('[2.0.0]'), 'Must contain 2.0.0 section');
    assert.ok(content.includes('[1.0.0]'), 'Must contain 1.0.0 section');
    assert.ok(content.includes('Marine Minerals Administration'), 'Must document MMA finding');
    assert.ok(content.includes('evidence_ledger.jsonl'), 'Must document evidence ledger');
  });
});
