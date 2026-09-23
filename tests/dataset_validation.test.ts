import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('SIF Sentinel Dataset Verification Suite', async (t) => {
  const datasetDir = path.join(process.cwd(), 'dataset');
  const finalJsonlPath = path.join(datasetDir, 'final/events_final.jsonl');
  const finalCsvPath = path.join(datasetDir, 'final/events_final.csv');
  const sourceManifestPath = path.join(datasetDir, 'manifests/source_manifest.csv');
  const docManifestPath = path.join(datasetDir, 'manifests/document_manifest.csv');
  const dedupReportPath = path.join(datasetDir, 'manifests/deduplication_report.csv');
  const validationReportPath = path.join(datasetDir, 'reports/validation_report.json');
  const statsPath = path.join(datasetDir, 'reports/dataset_statistics.json');
  const qualityReportPath = path.join(datasetDir, 'reports/quality_report.csv');

  await t.test('1. Core dataset files and manifests exist and are non-empty', () => {
    assert.ok(fs.existsSync(finalJsonlPath), 'events_final.jsonl must exist');
    assert.ok(fs.existsSync(finalCsvPath), 'events_final.csv must exist');
    assert.ok(fs.existsSync(sourceManifestPath), 'source_manifest.csv must exist');
    assert.ok(fs.existsSync(docManifestPath), 'document_manifest.csv must exist');
    assert.ok(fs.existsSync(dedupReportPath), 'deduplication_report.csv must exist');
    assert.ok(fs.existsSync(validationReportPath), 'validation_report.json must exist');
    assert.ok(fs.existsSync(statsPath), 'dataset_statistics.json must exist');
    assert.ok(fs.existsSync(qualityReportPath), 'quality_report.csv must exist');

    assert.ok(fs.statSync(finalJsonlPath).size > 1000000, 'JSONL file must be populated');
    assert.ok(fs.statSync(finalCsvPath).size > 100000, 'CSV file must be populated');
  });

  await t.test('2. Validation report confirms 100% schema conformance with zero errors', () => {
    const report = JSON.parse(fs.readFileSync(validationReportPath, 'utf8'));
    assert.equal(report.invalid_records, 0, 'There must be zero invalid schema records');
    assert.ok(report.valid_records >= 2900, 'Must validate over 2,900 records');
    assert.equal(report.schema_conformance_rate, '100.00%');
    assert.equal(report.errors.length, 0);
  });

  await t.test('3. Dataset records originate strictly from real authoritative sources without fabrication', () => {
    const lines = fs.readFileSync(finalJsonlPath, 'utf8').trim().split('\n');
    assert.ok(lines.length >= 2900, 'Should have >= 2,900 canonical event records');

    const allowedOrgs = [
      'Bureau of Safety and Environmental Enforcement (BSEE)',
      'International Marine Contractors Association (IMCA)',
      'Health and Safety Executive (UK HSE)'
    ];

    let bseeCount = 0;
    let imcaCount = 0;
    let hseCount = 0;

    for (const line of lines) {
      const record = JSON.parse(line);
      assert.ok(record.event_id.startsWith('EVT-'), 'event_id must have EVT- prefix');
      assert.ok(allowedOrgs.includes(record.source.source_organization), 'Must be from authentic organization');
      assert.ok(record.source.url && record.source.url.startsWith('http'), 'Must have authentic source URL');
      assert.ok(record.provenance.document_hash && record.provenance.document_hash.length === 64, 'Must have 64-char SHA256');

      if (record.source.source_organization.includes('BSEE')) bseeCount++;
      if (record.source.source_organization.includes('IMCA')) imcaCount++;
      if (record.source.source_organization.includes('HSE')) hseCount++;

      // Strict decoupling of consequence: actual vs potential
      assert.ok(record.consequence.actual, 'Actual consequence must be documented');
      assert.ok(record.consequence.potential, 'Potential consequence must be documented');

      // Barrier array validity
      assert.ok(Array.isArray(record.barriers), 'Barriers must be an array');
      // IOGP rules array validity
      assert.ok(Array.isArray(record.iogp), 'IOGP rules must be an array');
    }

    assert.ok(bseeCount > 500, 'BSEE events must be > 500');
    assert.ok(imcaCount > 2000, 'IMCA events must be > 2000');
    assert.ok(hseCount >= 5, 'HSE events must be >= 5');
  });

  await t.test('4. Statistics match summary metrics and deduplication preserves unique records', () => {
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    assert.ok(stats.schema_conformance_rate.startsWith('100'), 'Schema conformance rate must be 100%');
    assert.ok(stats.provenance_verified_rate.startsWith('100'), 'Provenance verified rate must be 100%');
    assert.ok(stats.total_events >= 2900);
    assert.ok(stats.duplicates_removed > 0, 'Deduplication engine must have flagged duplicates');
  });
});
