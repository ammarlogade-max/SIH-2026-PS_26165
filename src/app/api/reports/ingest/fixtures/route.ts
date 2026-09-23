// ─── GET /api/reports/ingest/fixtures ──────────────────────────────────────

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { parseUploadedDocument } from "@/lib/ingestion/ingestion-pipeline";
import { FileIngestionResult } from "@/lib/ingestion/types";

export async function GET() {
  try {
    const fixturesDir = path.join(process.cwd(), "demo_fixtures");
    if (!fs.existsSync(fixturesDir)) {
      return NextResponse.json({ error: "Demo fixtures not found on server." }, { status: 404 });
    }

    const fixtureFiles = fs.readdirSync(fixturesDir);
    const results: FileIngestionResult[] = [];

    for (const file of fixtureFiles) {
      const filePath = path.join(fixturesDir, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      const buffer = fs.readFileSync(filePath);
      const parsed = await parseUploadedDocument(buffer, file);
      results.push(parsed);
    }

    return NextResponse.json({
      success: true,
      total_fixtures: results.length,
      results,
    });
  } catch (err: any) {
    console.error("[API Ingest Fixtures] Error:", err);
    return NextResponse.json(
      { error: "Failed to load demo fixtures", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
